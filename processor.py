"""图片翻译处理器 - 阿里云电商图片翻译 + 后处理优化"""

import os
import re
import json
import logging
import requests
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
from alibabacloud_alimt20181012.client import Client
from alibabacloud_alimt20181012 import models
from alibabacloud_tea_openapi import models as open_api_models
from alibabacloud_tea_util import models as util_models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 字体路径
FONT_PATH = os.path.join(os.path.dirname(__file__), "assets", "SourceHanSansSC-Bold.otf")
FALLBACK_FONTS = [
    "/System/Library/Fonts/PingFang.ttc",
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
]

# 颜色策略
DARK_BLUE = (25, 45, 95)  # 销量数据用深蓝色

MAX_DIMENSION = 2048
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
API_TIMEOUT = 60000  # 60s


def convert_numbers(text: str) -> str:
    """将英文数字格式转换为中文格式"""
    # 处理 "2.5M S" 这种错误格式
    text = re.sub(r'(\d+\.?\d*)\s*M\s*S', lambda m: f"超过{int(float(m.group(1)) * 100)}万", text, flags=re.IGNORECASE)
    # 处理 M+ 格式
    text = re.sub(r'(\d+\.?\d*)\s*M\+', lambda m: f"超过{int(float(m.group(1)) * 100)}万", text, flags=re.IGNORECASE)
    # 处理 M 格式
    text = re.sub(r'(\d+\.?\d*)\s*M(?!\w)', lambda m: f"{int(float(m.group(1)) * 100)}万", text, flags=re.IGNORECASE)
    # 处理 K 格式
    text = re.sub(r'(\d+\.?\d*)\s*K', lambda m: f"{int(float(m.group(1)) * 1000)}", text, flags=re.IGNORECASE)
    return text


def fix_translations(text: str) -> str:
    """修复常见翻译错误 - 通用规则"""
    fixes = {
        # 标题修正
        "关键,一: 配料": "主要成分",
        "关键,一:配料": "主要成分",
        "关键成分": "主要成分",
        # 畅销品修正
        "畅销书": "畅销品",
        "全球畅销书": "全球畅销品",
        "Best Seller": "畅销品",
        # 销量表述优化
        "每分钟超过1个": "\n每分钟售出不止1份",
        "每分钟超过1": "\n每分钟售出不止1份",
        ",每分钟": "\n每分钟",
        "份每分钟": "份\n每分钟",
        "全球售出超过": "全球销量超",
        "全球售出": "全球销量超",
        # 添加量词
        "万,": "万份\n",
        "万份份": "万份",
        "*": "",  # 去掉星号
        # 翻译润色
        "有助于": "帮助",
        "使皮肤": "令肌肤",
        "整体皮肤": "整体肌肤状态，令肌肤",
        "柔软,水合": "柔软水润",
        "柔软的皮肤": "柔软水润",
    }
    for wrong, correct in fixes.items():
        text = text.replace(wrong, correct)
    
    # 确保数字后有量词"份"
    text = re.sub(r'(\d+万)(?!份)', r'\1份', text)
    return text


def classify_text_block(block: dict, all_blocks: list) -> str:
    """根据字体大小等特征分类文字块"""
    font_size = block.get('fontSize', 40)
    sizes = [b.get('fontSize', 40) for b in all_blocks if b.get('type') == 'text' and b.get('label') == 'element']
    
    if not sizes:
        return 'description'
    
    max_size = max(sizes)
    min_size = min(sizes)
    avg_size = sum(sizes) / len(sizes)
    
    if font_size >= max_size * 0.85:
        return 'title'
    elif font_size <= min_size * 1.2:
        return 'note'
    elif font_size >= avg_size * 0.9:
        return 'heading'
    else:
        return 'description'


def smart_line_wrap(text: str, font, max_width: int, draw) -> list:
    """智能分行：根据宽度自动换行"""
    if not text or max_width <= 0:
        return [text] if text else []
    
    # 如果已有换行符，先按换行符分割
    if '\n' in text:
        result = []
        for part in text.split('\n'):
            result.extend(smart_line_wrap(part, font, max_width, draw))
        return result
    
    lines = []
    current_line = ""
    
    # 优先断行点：逗号、句号、顿号、空格
    break_chars = '，。、,. '
    
    for char in text:
        test_line = current_line + char
        bbox = draw.textbbox((0, 0), test_line, font=font)
        width = bbox[2] - bbox[0]
        
        if width > max_width and current_line:
            # 寻找最近的断行点
            break_pos = -1
            for i in range(len(current_line) - 1, max(0, len(current_line) - 10), -1):
                if current_line[i] in break_chars:
                    break_pos = i + 1
                    break
            
            if break_pos > 0:
                lines.append(current_line[:break_pos])
                current_line = current_line[break_pos:] + char
            else:
                lines.append(current_line)
                current_line = char
        else:
            current_line += char
    
    if current_line:
        lines.append(current_line)
    
    return lines


def get_font(size: int):
    """获取字体，优先思源黑体"""
    fonts_to_try = [FONT_PATH] + FALLBACK_FONTS
    for fp in fonts_to_try:
        try:
            return ImageFont.truetype(fp, size)
        except:
            continue
    return ImageFont.load_default()


class ImageTranslator:
    def __init__(self, access_key_id: str = None, access_key_secret: str = None):
        self.access_key_id = access_key_id or os.getenv("ALI_ACCESS_KEY_ID")
        self.access_key_secret = access_key_secret or os.getenv("ALI_ACCESS_KEY_SECRET")
        
        if not self.access_key_id or not self.access_key_secret:
            raise ValueError("缺少阿里云 AccessKey 配置")
        
        self._client = None
    
    @property
    def client(self) -> Client:
        if self._client is None:
            config = open_api_models.Config(
                access_key_id=self.access_key_id,
                access_key_secret=self.access_key_secret
            )
            config.endpoint = "mt.cn-hangzhou.aliyuncs.com"
            self._client = Client(config)
        return self._client
    
    def validate_image(self, image: Image.Image, file_size: int) -> tuple[bool, str]:
        """验证图片尺寸和大小"""
        if file_size > MAX_FILE_SIZE:
            return False, f"图片大小超过限制 ({file_size / 1024 / 1024:.1f}MB > 10MB)"
        
        width, height = image.size
        if width > 8192 or height > 8192:
            return False, f"图片尺寸超过限制 ({width}x{height} > 8192x8192)"
        
        if width / height > 10 or height / width > 10:
            return False, "图片宽高比超过 10:1"
        
        return True, ""
    
    def resize_if_needed(self, image: Image.Image) -> Image.Image:
        """如果图片过大则缩放"""
        width, height = image.size
        if width <= MAX_DIMENSION and height <= MAX_DIMENSION:
            return image
        
        ratio = min(MAX_DIMENSION / width, MAX_DIMENSION / height)
        new_size = (int(width * ratio), int(height * ratio))
        logger.info(f"缩放图片: {width}x{height} -> {new_size[0]}x{new_size[1]}")
        return image.resize(new_size, Image.Resampling.LANCZOS)
    
    def translate(
        self,
        image: Image.Image,
        source_lang: str = "auto",
        target_lang: str = "zh",
        field: str = "e-commerce",
        enable_postprocess: bool = True
    ) -> Image.Image:
        """
        翻译图片中的文字
        
        Args:
            image: PIL Image 对象
            source_lang: 源语言 (auto/en/zh/ja/ko 等)
            target_lang: 目标语言
            field: 翻译领域 (e-commerce/general)
            enable_postprocess: 是否启用后处理优化
        
        Returns:
            翻译后的 PIL Image 对象
        """
        # 转换为 RGB
        if image.mode in ('RGBA', 'P'):
            image = image.convert('RGB')
        
        # 缩放
        image = self.resize_if_needed(image)
        
        # 转为 base64
        import base64
        buffer = BytesIO()
        image.save(buffer, format='JPEG', quality=90)
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        # 构造请求（启用编辑器数据用于后处理）
        ext = '{"needEditorData": "true"}' if enable_postprocess else None
        request = models.TranslateImageRequest(
            source_language=source_lang,
            target_language=target_lang,
            image_base_64=img_base64,
            field=field,
            ext=ext
        )
        
        runtime = util_models.RuntimeOptions(
            read_timeout=API_TIMEOUT,
            connect_timeout=30000
        )
        
        logger.info(f"调用阿里云翻译 API: {source_lang} -> {target_lang}, field={field}, postprocess={enable_postprocess}")
        
        try:
            response = self.client.translate_image_with_options(request, runtime)
            
            if str(response.body.code) == "200" and response.body.data:
                data = response.body.data
                
                # 如果启用后处理且有编辑器数据
                if enable_postprocess and data.template_json and data.in_painting_url:
                    logger.info("启用后处理优化...")
                    return self._postprocess(data.template_json, data.in_painting_url)
                else:
                    # 直接返回原始结果
                    result_url = data.final_image_url
                    logger.info(f"翻译成功，下载结果图片...")
                    img_response = requests.get(result_url, timeout=30)
                    img_response.raise_for_status()
                    return Image.open(BytesIO(img_response.content))
            else:
                raise Exception(f"翻译失败: {response.body.message}")
                
        except Exception as e:
            logger.error(f"翻译出错: {str(e)}")
            raise
    
    def _postprocess(self, template_json: str, in_painting_url: str) -> Image.Image:
        """后处理：修正翻译 + 重新渲染"""
        # 下载干净背景图
        bg_response = requests.get(in_painting_url, timeout=30)
        bg_response.raise_for_status()
        img = Image.open(BytesIO(bg_response.content))
        draw = ImageDraw.Draw(img)
        
        # 解析模板
        template = json.loads(template_json)
        
        # 遍历文字块
        for child in template.get('children', []):
            if child.get('type') == 'text' and child.get('label') == 'element':
                content = child.get('content', '')
                if not content:
                    continue
                
                # 后处理：数字转换 + 翻译修正
                content = convert_numbers(content)
                content = fix_translations(content)
                
                # 获取位置和样式
                x = child.get('left', 0)
                y = child.get('top', 0)
                font_size = child.get('fontSize', 40)
                width = child.get('width', 500)
                original_color = child.get('color', '#000000ff')
                
                # 解析原始颜色
                if original_color.startswith('#') and len(original_color) >= 7:
                    r = int(original_color[1:3], 16)
                    g = int(original_color[3:5], 16)
                    b = int(original_color[5:7], 16)
                    rgb_color = (r, g, b)
                else:
                    rgb_color = (0, 0, 0)
                
                # 颜色优化：销量相关文字用深蓝色
                if any(kw in content for kw in ['万', '销量', '售出', '分钟']):
                    rgb_color = DARK_BLUE
                
                # 获取字体
                font = get_font(font_size)
                
                # 处理多行文字
                lines = content.split('\n')
                current_y = y
                
                for line in lines:
                    if not line.strip():
                        continue
                    
                    # 计算文字宽度实现居中
                    bbox = draw.textbbox((0, 0), line, font=font)
                    text_width = bbox[2] - bbox[0]
                    
                    # 居中对齐
                    centered_x = x + (width - text_width) // 2
                    if centered_x < x:
                        centered_x = x
                    
                    draw.text((centered_x, current_y), line, font=font, fill=rgb_color)
                    current_y += font_size + 10
        
        logger.info("后处理完成")
        return img

#!/usr/bin/env python3
"""测试后处理方案 - 获取编辑器数据并修改译文"""

import os
import json
import re
import requests
from io import BytesIO
from dotenv import load_dotenv
from PIL import Image, ImageDraw, ImageFont
from alibabacloud_alimt20181012.client import Client
from alibabacloud_alimt20181012 import models
from alibabacloud_tea_openapi import models as open_api_models
from alibabacloud_tea_util import models as util_models

load_dotenv()
ACCESS_KEY_ID = os.getenv("ALI_ACCESS_KEY_ID")
ACCESS_KEY_SECRET = os.getenv("ALI_ACCESS_KEY_SECRET")

# medicube 畅销品图片（包含 2.5M+ 数字）
IMAGE_URL = "https://m.media-amazon.com/images/I/710c7ap9g3L._SL1500_.jpg"

def create_client():
    config = open_api_models.Config(
        access_key_id=ACCESS_KEY_ID,
        access_key_secret=ACCESS_KEY_SECRET
    )
    config.endpoint = "mt.cn-hangzhou.aliyuncs.com"
    return Client(config)


def convert_numbers(text):
    """将英文数字格式转换为中文格式
    2.5M+ → 超过250万
    2.5M → 250万
    1M → 100万
    """
    # 处理 "2.5M S" 这种错误格式（阿里云翻译bug）
    text = re.sub(r'(\d+\.?\d*)\s*M\s*S', lambda m: f"超过{int(float(m.group(1)) * 100)}万", text, flags=re.IGNORECASE)
    # 处理 M+ 格式
    text = re.sub(r'(\d+\.?\d*)\s*M\+', lambda m: f"超过{int(float(m.group(1)) * 100)}万", text, flags=re.IGNORECASE)
    # 处理 M 格式
    text = re.sub(r'(\d+\.?\d*)\s*M(?!\w)', lambda m: f"{int(float(m.group(1)) * 100)}万", text, flags=re.IGNORECASE)
    # 处理 K 格式
    text = re.sub(r'(\d+\.?\d*)\s*K', lambda m: f"{int(float(m.group(1)) * 1000)}", text, flags=re.IGNORECASE)
    return text


def fix_translations(text):
    """修复常见翻译错误 - 学习竞品策略"""
    fixes = {
        # 畅销品修正
        "畅销书": "畅销品",
        "全球畅销书": "全球畅销品",
        "Best Seller": "畅销品",
        # 销量表述优化
        "每分钟超过1个": "每分钟售出不止1份",
        ",每分钟超过1个": "",  # 分行显示，去掉逗号
        "全球售出超过": "全球销量超",
        "全球售出": "全球销量超",
        # 添加量词
        "万,": "万份\n",  # 分行 + 加量词（去掉星号）
        "万份份": "万份",  # 防止重复
        "*": "",  # 去掉星号
    }
    for wrong, correct in fixes.items():
        text = text.replace(wrong, correct)
    
    # 确保数字后有量词"份"
    import re
    text = re.sub(r'(\d+万)(?!份)', r'\1份', text)
    
    return text


def process_template(template_json):
    """处理模板数据，修复译文"""
    data = json.loads(template_json)
    
    print("\n=== 文字块分析 ===")
    for child in data.get('children', []):
        if child.get('type') == 'text' and child.get('label') == 'element':
            ocr = child.get('ocrContent', '')
            content = child.get('content', '')
            
            if ocr or content:
                # 后处理
                new_content = convert_numbers(content)
                new_content = fix_translations(new_content)
                
                if new_content != content:
                    print(f"原文: {ocr}")
                    print(f"原译: {content}")
                    print(f"修正: {new_content}")
                    print("---")
                    child['content'] = new_content
                else:
                    print(f"原文: {ocr} → 译文: {content} (无需修改)")
    
    return data


def render_text_on_image(template_data, background_path, output_path):
    """将处理后的文字渲染到背景图上 - 学习竞品策略"""
    img = Image.open(background_path)
    draw = ImageDraw.Draw(img)
    img_width = img.width
    
    # 中文字体路径（优先思源黑体）
    chinese_fonts = [
        "/Users/apple/Desktop/picturetranslate/SourceHanSansSC-Bold.otf",  # 思源黑体
        "/System/Library/Fonts/PingFang.ttc",        # 苹方（备选）
        "/System/Library/Fonts/Hiragino Sans GB.ttc", # 冬青黑体
    ]
    
    font_path = None
    for fp in chinese_fonts:
        try:
            ImageFont.truetype(fp, 40)
            font_path = fp
            print(f"使用字体: {fp}")
            break
        except:
            continue
    
    # 颜色策略 - 更深更亮
    DARK_BLUE = (25, 45, 95)       # #192D5F - 更深的蓝色
    BRIGHT_BLUE = (30, 60, 120)    # #1E3C78 - 深亮蓝色
    PINK_TITLE = (220, 80, 120)    # #DC5078 - 更亮的粉色
    
    # 遍历文字块
    for child in template_data.get('children', []):
        if child.get('type') == 'text' and child.get('label') == 'element':
            content = child.get('content', '')
            if not content:
                continue
            
            x = child.get('left', 0)
            y = child.get('top', 0)
            font_size = child.get('fontSize', 40)
            width = child.get('width', 500)
            original_color = child.get('color', '#000000ff')
            ocr_content = child.get('ocrContent', '')
            
            # 解析原始颜色
            if original_color.startswith('#') and len(original_color) >= 7:
                r = int(original_color[1:3], 16)
                g = int(original_color[3:5], 16)
                b = int(original_color[5:7], 16)
                rgb_color = (r, g, b)
            else:
                rgb_color = (0, 0, 0)
            
            # 竞品策略：销量相关文字用深蓝色
            if any(kw in content for kw in ['万', '销量', '售出', '分钟']):
                rgb_color = DARK_BLUE
                print(f"  [颜色优化] 改用深蓝色")
            
            # 加载字体
            try:
                font = ImageFont.truetype(font_path, font_size)
            except:
                font = ImageFont.load_default()
            
            # 处理多行文字
            lines = content.split('\n')
            current_y = y
            
            for line in lines:
                if not line.strip():
                    continue
                
                # 计算文字宽度实现居中
                bbox = draw.textbbox((0, 0), line, font=font)
                text_width = bbox[2] - bbox[0]
                
                # 居中对齐（在原区域内）
                centered_x = x + (width - text_width) // 2
                if centered_x < x:
                    centered_x = x
                
                draw.text((centered_x, current_y), line, font=font, fill=rgb_color)
                print(f"渲染: '{line}' at ({centered_x}, {current_y}) size={font_size} color={rgb_color}")
                
                current_y += font_size + 10  # 行间距
    
    img.save(output_path, quality=95)
    print(f"\n渲染结果已保存到: {output_path}")
    return output_path


def main():
    client = create_client()
    
    request = models.TranslateImageRequest(
        source_language="en",
        target_language="zh",
        image_url=IMAGE_URL,
        field="e-commerce",
        ext='{"needEditorData": "true"}'
    )
    
    runtime = util_models.RuntimeOptions(
        read_timeout=60000,
        connect_timeout=30000
    )
    
    print("正在调用阿里云 API...")
    response = client.translate_image_with_options(request, runtime)
    
    if str(response.body.code) == "200" and response.body.data:
        data = response.body.data
        
        # 获取编辑器数据
        template_json = data.template_json
        in_painting_url = data.in_painting_url
        final_url = data.final_image_url
        
        print(f"\n原始译图: {final_url}")
        print(f"擦除背景: {in_painting_url}")
        
        # 处理模板
        if template_json:
            processed = process_template(template_json)
            
            # 保存处理后的 JSON
            with open("/Users/apple/Desktop/picturetranslate/processed_template.json", "w", encoding="utf-8") as f:
                json.dump(processed, f, ensure_ascii=False, indent=2)
            print("\n处理后的模板已保存到 processed_template.json")
        
        # 下载原始译图
        img_response = requests.get(final_url, timeout=30)
        with open("/Users/apple/Desktop/picturetranslate/original_result.jpg", "wb") as f:
            f.write(img_response.content)
        print("原始译图已保存到 original_result.jpg")
        
        # 下载擦除背景图
        bg_response = requests.get(in_painting_url, timeout=30)
        bg_path = "/Users/apple/Desktop/picturetranslate/clean_background.jpg"
        with open(bg_path, "wb") as f:
            f.write(bg_response.content)
        print("擦除背景图已保存到 clean_background.jpg")
        
        # 渲染后处理的文字到背景图
        if template_json:
            output_path = "/Users/apple/Desktop/picturetranslate/postprocessed_result.jpg"
            render_text_on_image(processed, bg_path, output_path)
            print(f"\n对比文件:")
            print(f"  原始译图: original_result.jpg")
            print(f"  后处理图: postprocessed_result.jpg")
    else:
        print(f"API 调用失败: {response.body.message}")


if __name__ == "__main__":
    main()

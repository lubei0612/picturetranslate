"""Aliyun translation engine implementation."""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import os
from io import BytesIO
from typing import Any, Iterable, Mapping

import requests
from PIL import Image, ImageDraw, ImageFont
from alibabacloud_alimt20181012 import models
from alibabacloud_alimt20181012.client import Client
from alibabacloud_tea_openapi import models as open_api_models
from alibabacloud_tea_util import models as util_models

from core.config import settings
from core.engines.base import TranslateEngine, TranslateResult
from core.engines.registry import EngineRegistry


logger = logging.getLogger(__name__)

ASSETS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets")
FONT_PATH = os.path.join(ASSETS_DIR, "SourceHanSansSC-Bold.otf")
FALLBACK_FONTS = [
    "/System/Library/Fonts/PingFang.ttc",
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
]

DARK_BLUE = (25, 45, 95)
MAX_DIMENSION = 2048
API_TIMEOUT = 60000


def convert_numbers(text: str) -> str:
    import re

    text = re.sub(r"(\d+\.?\d*)\s*M\s*S", lambda m: f"超过{int(float(m.group(1)) * 100)}万", text, flags=re.IGNORECASE)
    text = re.sub(r"(\d+\.?\d*)\s*M\+", lambda m: f"超过{int(float(m.group(1)) * 100)}万", text, flags=re.IGNORECASE)
    text = re.sub(r"(\d+\.?\d*)\s*M(?!\w)", lambda m: f"{int(float(m.group(1)) * 100)}万", text, flags=re.IGNORECASE)
    text = re.sub(r"(\d+\.?\d*)\s*K", lambda m: f"{int(float(m.group(1)) * 1000)}", text, flags=re.IGNORECASE)
    return text


def fix_translations(text: str) -> str:
    replacements = {
        "关键,一: 配料": "主要成分",
        "关键,一:配料": "主要成分",
        "关键成分": "主要成分",
        "畅销书": "畅销品",
        "全球畅销书": "全球畅销品",
        "Best Seller": "畅销品",
        "每分钟超过1个": "\n每分钟售出不止1份",
        "每分钟超过1": "\n每分钟售出不止1份",
        ",每分钟": "\n每分钟",
        "份每分钟": "份\n每分钟",
        "全球售出超过": "全球销量超",
        "全球售出": "全球销量超",
        "万,": "万份\n",
        "万份份": "万份",
        "*": "",
        "有助于": "帮助",
        "使皮肤": "令肌肤",
        "整体皮肤": "整体肌肤状态，令肌肤",
        "柔软,水合": "柔软水润",
        "柔软的皮肤": "柔软水润",
    }
    for wrong, correct in replacements.items():
        text = text.replace(wrong, correct)
    import re

    text = re.sub(r"(\d+万)(?!份)", r"\1份", text)
    return text


def get_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    fonts = [FONT_PATH] + FALLBACK_FONTS
    for path in fonts:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


class AliyunEngine(TranslateEngine):
    name = "aliyun"
    display_name = "Aliyun Translate"

    def __init__(
        self,
        *,
        access_key_id: str | None = None,
        access_key_secret: str | None = None,
        region: str | None = None,
    ) -> None:
        super().__init__()
        self.access_key_id = access_key_id or settings.ALI_ACCESS_KEY_ID
        self.access_key_secret = access_key_secret or settings.ALI_ACCESS_KEY_SECRET
        self.region = region or settings.ALI_REGION
        self._client: Client | None = None

    async def translate(
        self,
        *,
        image: bytes,
        source_lang: str,
        target_lang: str,
        field: str,
        enable_postprocess: bool = True,
        mask: bytes | None = None,
        protect_product: bool | None = None,
    ) -> TranslateResult:
        return await asyncio.to_thread(
            self._translate_sync,
            image,
            source_lang,
            target_lang,
            field,
            enable_postprocess,
            mask,
            protect_product,
        )

    async def health_check(self) -> bool:
        def _check() -> bool:
            try:
                _ = self.client
                return True
            except Exception as exc:  # pragma: no cover - SDK errors
                logger.error("Aliyun engine health check failed: %s", exc)
                return False

        return await asyncio.to_thread(_check)

    @property
    def client(self) -> Client:
        if self._client is None:
            config = open_api_models.Config(
                access_key_id=self.access_key_id,
                access_key_secret=self.access_key_secret,
            )
            config.endpoint = "mt.cn-hangzhou.aliyuncs.com"
            self._client = Client(config)
        return self._client

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _translate_sync(
        self,
        image_bytes: bytes,
        source_lang: str,
        target_lang: str,
        field: str,
        enable_postprocess: bool,
        mask: bytes | None,
        protect_product: bool | None,
    ) -> TranslateResult:
        pil_image = self._load_image(image_bytes)
        prepared = self._resize_if_needed(self._ensure_rgb(pil_image))

        buffer = BytesIO()
        prepared.save(buffer, format="JPEG", quality=90)
        img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        ext = {"needEditorData": "true"}
        if protect_product is not None:
            ext["protectProduct"] = "true" if protect_product else "false"

        request = models.TranslateImageRequest(
            source_language=source_lang,
            target_language=target_lang,
            image_base_64=img_base64,
            field=field,
            ext=json.dumps(ext) if enable_postprocess else None,
        )

        runtime = util_models.RuntimeOptions(read_timeout=API_TIMEOUT, connect_timeout=30000)

        logger.info(
            "调用阿里云翻译 API: %s -> %s field=%s postprocess=%s",
            source_lang,
            target_lang,
            field,
            enable_postprocess,
        )

        response = self.client.translate_image_with_options(request, runtime)
        body = response.body
        if str(body.code) != "200" or not body.data:
            raise RuntimeError(f"翻译失败: {body.message}")

        data = body.data
        layers: list[dict[str, Any]] = []

        if enable_postprocess and data.template_json and data.in_painting_url:
            logger.info("启用后处理优化渲染文字图层")
            processed_image, layers = self._postprocess(data.template_json, data.in_painting_url)
            image_result = self._to_png_bytes(processed_image)
        else:
            logger.info("使用阿里云生成的最终图片")
            image_result = self._download_result(data.final_image_url)

        metadata: Mapping[str, Any] = {
            "requestId": body.request_id,
            "sourceLang": source_lang,
            "targetLang": target_lang,
            "field": field,
        }

        return TranslateResult(
            engine_name=self.name,
            translated_image=image_result,
            layers=layers,
            metadata=metadata,
        )

    def _load_image(self, image_bytes: bytes) -> Image.Image:
        image = Image.open(BytesIO(image_bytes))
        image.load()
        return image

    @staticmethod
    def _ensure_rgb(image: Image.Image) -> Image.Image:
        return image.convert("RGB") if image.mode in ("RGBA", "P") else image

    def _resize_if_needed(self, image: Image.Image) -> Image.Image:
        width, height = image.size
        if width <= MAX_DIMENSION and height <= MAX_DIMENSION:
            return image
        ratio = min(MAX_DIMENSION / width, MAX_DIMENSION / height)
        new_size = (int(width * ratio), int(height * ratio))
        logger.info("缩放图片: %sx%s -> %sx%s", width, height, *new_size)
        return image.resize(new_size, Image.Resampling.LANCZOS)

    def _postprocess(self, template_json: str, in_painting_url: str) -> tuple[Image.Image, list[dict[str, Any]]]:
        background = self._download_image(in_painting_url)
        draw = ImageDraw.Draw(background)
        template = json.loads(template_json)
        layers: list[dict[str, Any]] = []

        for child in template.get("children", []):
            if child.get("type") != "text" or child.get("label") != "element":
                continue

            content = child.get("content", "")
            if not content:
                continue

            content = fix_translations(convert_numbers(content))
            child["content"] = content

            bbox = [
                float(child.get("left", 0.0)),
                float(child.get("top", 0.0)),
                float(child.get("width", 0.0)),
                float(child.get("height", 0.0)),
            ]

            style = self._extract_style(child)
            self._render_lines(draw, child, content, style)

            layers.append(
                {
                    "originalText": child.get("ocrContent", ""),
                    "translatedText": content,
                    "bbox": bbox,
                    "style": style,
                }
            )

        return background, layers

    def _extract_style(self, child: Mapping[str, Any]) -> dict[str, Any]:
        color = child.get("color", "#000000")
        if isinstance(color, str) and len(color) == 9:
            color = color[:7]
        return {
            "fontFamily": child.get("fontFamily", "Arial"),
            "fontSize": float(child.get("fontSize", 40)),
            "fontColor": color,
            "backgroundColor": child.get("backgroundColor"),
            "rotation": float(child.get("rotation", 0)),
        }

    def _render_lines(self, draw: ImageDraw.ImageDraw, child: Mapping[str, Any], content: str, style: Mapping[str, Any]) -> None:
        x = float(child.get("left", 0))
        y = float(child.get("top", 0))
        width = float(child.get("width", 500))
        font_size = int(style["fontSize"])
        font = get_font(font_size)
        text_color = self._determine_color(content, style["fontColor"])

        lines = content.split("\n")
        current_y = y
        for line in lines:
            if not line.strip():
                continue
            bbox = draw.textbbox((0, 0), line, font=font)
            text_width = bbox[2] - bbox[0]
            centered_x = x + max((width - text_width) / 2, 0)
            draw.text((centered_x, current_y), line, font=font, fill=text_color)
            current_y += font_size + 10

    def _determine_color(self, content: str, original: str | None) -> tuple[int, int, int]:
        if any(keyword in content for keyword in ["万", "销量", "售出", "分钟"]):
            return DARK_BLUE
        if original and original.startswith("#") and len(original) >= 7:
            r = int(original[1:3], 16)
            g = int(original[3:5], 16)
            b = int(original[5:7], 16)
            return (r, g, b)
        return (0, 0, 0)

    def _download_result(self, url: str) -> bytes:
        image = self._download_image(url)
        return self._to_png_bytes(image)

    def _download_image(self, url: str) -> Image.Image:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        image = Image.open(BytesIO(response.content))
        image.load()
        return image

    @staticmethod
    def _to_png_bytes(image: Image.Image) -> bytes:
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        return buffer.getvalue()


_default_engine = AliyunEngine()
EngineRegistry.register(_default_engine, default=True)


__all__ = ["AliyunEngine"]

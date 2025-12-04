"""Legacy ImageTranslator shim backed by the new engine registry."""

from __future__ import annotations

import asyncio
from io import BytesIO
from typing import Optional

from PIL import Image, UnidentifiedImageError

from core.engines import EngineRegistry
from core.engines.aliyun import AliyunEngine
from core.exceptions import TranslationError


class ImageTranslator:
    """Backward-compatible wrapper that delegates to the strategy engines."""

    def __init__(self, access_key_id: str | None = None, access_key_secret: str | None = None):
        self._custom_engine: Optional[AliyunEngine] = None
        if access_key_id or access_key_secret:
            self._custom_engine = AliyunEngine(
                access_key_id=access_key_id,
                access_key_secret=access_key_secret,
            )
        self._preferred_engine = AliyunEngine.name

    def translate(
        self,
        image: Image.Image,
        source_lang: str = "auto",
        target_lang: str = "zh",
        field: str = "e-commerce",
        enable_postprocess: bool = True,
        *,
        protect_product: Optional[bool] = None,
        engine: Optional[str] = None,
    ) -> Image.Image:
        """Keep the legacy synchronous API expected by TranslatorService."""

        try:
            image_bytes = self._image_to_bytes(image)
        except (UnidentifiedImageError, OSError) as exc:  # pragma: no cover - PIL raises
            raise TranslationError(f"无法读取图片: {exc}") from exc

        result_bytes = self._run_translation(
            image_bytes=image_bytes,
            source_lang=source_lang,
            target_lang=target_lang,
            field=field,
            enable_postprocess=enable_postprocess,
            protect_product=protect_product,
            preferred_engine=engine,
        )

        return Image.open(BytesIO(result_bytes))

    def _run_translation(
        self,
        *,
        image_bytes: bytes,
        source_lang: str,
        target_lang: str,
        field: str,
        enable_postprocess: bool,
        protect_product: Optional[bool],
        preferred_engine: Optional[str],
    ) -> bytes:
        if self._custom_engine is not None:
            coro = self._custom_engine.translate(
                image=image_bytes,
                source_lang=source_lang,
                target_lang=target_lang,
                field=field,
                enable_postprocess=enable_postprocess,
                mask=None,
                protect_product=protect_product,
            )
        else:
            selected_engine = preferred_engine or self._preferred_engine
            coro = EngineRegistry.translate_with_fallback(
                preferred=selected_engine,
                image=image_bytes,
                source_lang=source_lang,
                target_lang=target_lang,
                field=field,
                enable_postprocess=enable_postprocess,
                mask=None,
                protect_product=protect_product,
            )

        result = self._run_async(coro)
        if not result.translated_image:
            raise TranslationError("翻译引擎没有返回图片数据")
        return result.translated_image

    def _run_async(self, coro):
        try:
            return asyncio.run(coro)
        except RuntimeError:
            loop = asyncio.new_event_loop()
            try:
                return loop.run_until_complete(coro)
            finally:
                loop.close()

    @staticmethod
    def _image_to_bytes(image: Image.Image) -> bytes:
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        return buffer.getvalue()


__all__ = ["ImageTranslator"]

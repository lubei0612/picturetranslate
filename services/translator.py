"""Translator service wrapping processor.ImageTranslator."""

from __future__ import annotations

from io import BytesIO
from typing import Optional

from PIL import Image

from core.config import settings
from core.exceptions import TranslationError
from processor import ImageTranslator
from utils.retry import retry_on_failure


class TranslatorService:
    """High-level translator orchestrating processor module."""

    def __init__(self) -> None:
        self._translator: Optional[ImageTranslator] = None

    @property
    def translator(self) -> ImageTranslator:
        if self._translator is None:
            self._translator = ImageTranslator(
                access_key_id=settings.ALI_ACCESS_KEY_ID,
                access_key_secret=settings.ALI_ACCESS_KEY_SECRET,
            )
        return self._translator

    @retry_on_failure(
        max_attempts=settings.RETRY_MAX_ATTEMPTS,
        delay=settings.RETRY_DELAY,
    )
    def translate(
        self,
        image_bytes: bytes,
        source_lang: str,
        target_lang: str,
        field: str,
        enable_postprocess: bool,
    ) -> bytes:
        """Execute translation, returning PNG bytes."""

        try:
            pil_image = Image.open(BytesIO(image_bytes))
        except Exception as exc:  # pragma: no cover - PIL handles this
            raise TranslationError(f"无法读取图片: {exc}")

        try:
            translated = self.translator.translate(
                image=pil_image,
                source_lang=source_lang,
                target_lang=target_lang,
                field=field,
                enable_postprocess=enable_postprocess,
            )
        except Exception as exc:  # pragma: no cover - depends on SDK
            raise TranslationError(str(exc))

        buffer = BytesIO()
        translated.save(buffer, format="PNG")
        return buffer.getvalue()


__all__ = ["TranslatorService"]

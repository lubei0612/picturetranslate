"""Translator service wrapping processor.ImageTranslator."""

from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from typing import Callable, Optional

from PIL import Image, UnidentifiedImageError

from core.config import settings
from core.exceptions import TranslationError
from core.processor import ImageTranslator
from utils.retry import retry_on_failure


@dataclass
class TranslateParams:
    """Strongly-typed translation parameters for downstream services."""

    source_lang: str
    target_lang: str
    field: str = "e-commerce"
    enable_postprocess: bool = True
    protect_product: Optional[bool] = None
    engine: Optional[str] = None


class TranslatorService:
    """High-level translator orchestrating processor module."""

    def __init__(self, translator_factory: Callable[[], ImageTranslator] | None = None) -> None:
        self._translator: Optional[ImageTranslator] = None
        self._translator_factory = translator_factory or self._default_translator

    def _default_translator(self) -> ImageTranslator:
        return ImageTranslator(
            access_key_id=settings.ALI_ACCESS_KEY_ID,
            access_key_secret=settings.ALI_ACCESS_KEY_SECRET,
        )

    @property
    def translator(self) -> ImageTranslator:
        if self._translator is None:
            self._translator = self._translator_factory()
        return self._translator

    def translate(
        self,
        image_bytes: bytes,
        source_lang: str,
        target_lang: str,
        field: str,
        enable_postprocess: bool,
        *,
        protect_product: Optional[bool] = None,
        engine: Optional[str] = None,
    ) -> bytes:
        """Execute translation, returning PNG bytes."""

        params = TranslateParams(
            source_lang=source_lang,
            target_lang=target_lang,
            field=field,
            enable_postprocess=enable_postprocess,
            protect_product=protect_product,
            engine=engine,
        )
        return self.translate_with_params(image_bytes=image_bytes, params=params)

    def translate_with_params(self, image_bytes: bytes, params: TranslateParams) -> bytes:
        pil_image = self._load_image(image_bytes)
        translated = self._execute_with_retry(pil_image, params)
        return self._to_png_bytes(translated)

    def _load_image(self, image_bytes: bytes) -> Image.Image:
        try:
            image = Image.open(BytesIO(image_bytes))
            image.load()
            return image
        except (UnidentifiedImageError, OSError) as exc:  # pragma: no cover - PIL handles this
            raise TranslationError(f"无法读取图片: {exc}") from exc

    @retry_on_failure(
        max_attempts=settings.RETRY_MAX_ATTEMPTS,
        delay=settings.RETRY_DELAY,
        backoff="exponential",
        jitter=0.3,
    )
    def _execute_with_retry(self, pil_image: Image.Image, params: TranslateParams) -> Image.Image:
        try:
            return self.translator.translate(
                image=pil_image,
                source_lang=params.source_lang,
                target_lang=params.target_lang,
                field=params.field,
                enable_postprocess=params.enable_postprocess,
                engine=params.engine,
            )
        except Exception as exc:  # pragma: no cover - depends on SDK
            raise TranslationError(str(exc)) from exc

    @staticmethod
    def _to_png_bytes(image: Image.Image) -> bytes:
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        return buffer.getvalue()


__all__ = ["TranslatorService", "TranslateParams"]

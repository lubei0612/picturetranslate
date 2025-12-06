from __future__ import annotations

from io import BytesIO

from PIL import Image

from core.processor import TranslationOutput
from services.cache import CacheService
from services.translator import TranslatorService


def _image_bytes() -> bytes:
    image = Image.new("RGB", (32, 32), color="blue")
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def test_cache_service_set_get_and_ttl(monkeypatch):
    cache = CacheService()
    cache.set("foo", b"bar")
    assert cache.get("foo") == b"bar"

    # 强制 TTL 过期
    cache._ttl = -1  # type: ignore[attr-defined]
    assert cache.get("foo") is None


def test_translator_service_returns_bytes(monkeypatch):
    class FakeTranslator:
        def translate(
            self,
            image,
            source_lang,
            target_lang,
            field,
            enable_postprocess,
            *,
            protect_product=None,
            engine=None,
        ):  # type: ignore[override]
            _ = (image, source_lang, target_lang, field, enable_postprocess, protect_product, engine)
            # 返回 TranslationOutput，包含 image_bytes
            result_image = Image.new("RGB", (16, 16), color="green")
            buffer = BytesIO()
            result_image.save(buffer, format="PNG")
            return TranslationOutput(
                image_bytes=buffer.getvalue(),
                editor_data='{"test": true}',
                inpainting_url="https://example.com/bg.png",
            )

    service = TranslatorService()
    service._translator = FakeTranslator()  # type: ignore[assignment]

    result = service.translate(
        image_bytes=_image_bytes(),
        source_lang="auto",
        target_lang="zh",
        field="e-commerce",
        enable_postprocess=True,
    )

    assert isinstance(result, TranslationOutput)
    assert isinstance(result.image_bytes, bytes)
    assert len(result.image_bytes) > 10
    assert result.editor_data == '{"test": true}'
    assert result.inpainting_url == "https://example.com/bg.png"

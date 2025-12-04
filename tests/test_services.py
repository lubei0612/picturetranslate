from __future__ import annotations

from io import BytesIO

from PIL import Image

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
        def translate(self, image, source_lang, target_lang, field, enable_postprocess):  # type: ignore[override]
            _ = (image, source_lang, target_lang, field, enable_postprocess)
            return Image.new("RGB", (16, 16), color="green")

    service = TranslatorService()
    service._translator = FakeTranslator()  # type: ignore[assignment]

    result = service.translate(
        image_bytes=_image_bytes(),
        source_lang="auto",
        target_lang="zh",
        field="e-commerce",
        enable_postprocess=True,
    )

    assert isinstance(result, bytes)
    assert len(result) > 10

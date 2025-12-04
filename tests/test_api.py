from __future__ import annotations

from io import BytesIO

import pytest
from fastapi import FastAPI
from PIL import Image
from starlette.status import HTTP_200_OK, HTTP_400_BAD_REQUEST

from api.dependencies import get_cache_service, get_translator_service
from api.main import app as fastapi_app
from services.cache import CacheService

try:
    import httpx
except ImportError:  # pragma: no cover
    httpx = None


class FakeCache(CacheService):
    def __init__(self):
        super().__init__()
        self._storage: dict[str, bytes] = {}

    def get(self, key: str):  # type: ignore[override]
        return self._storage.get(key)

    def set(self, key: str, value: bytes):  # type: ignore[override]
        self._storage[key] = value


class FakeTranslator:
    def __init__(self):
        self.calls = 0

    def translate(self, image_bytes, source_lang, target_lang, field, enable_postprocess):  # type: ignore[override]
        self.calls += 1
        image = Image.new("RGB", (8, 8), color="purple")
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        return buffer.getvalue()


def create_client(app: FastAPI):
    assert httpx is not None, "httpx must be installed"
    return httpx.AsyncClient(app=app, base_url="http://test")


def make_image_bytes() -> bytes:
    image = Image.new("RGB", (32, 32), color="orange")
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


@pytest.fixture(autouse=True)
def override_dependencies():
    fake_translator = FakeTranslator()
    fake_cache = FakeCache()

    fastapi_app.dependency_overrides[get_translator_service] = lambda: fake_translator
    fastapi_app.dependency_overrides[get_cache_service] = lambda: fake_cache
    yield fake_translator
    fastapi_app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_health_endpoint():
    async with create_client(fastapi_app) as client:
        resp = await client.get("/health")
        assert resp.status_code == HTTP_200_OK
        assert resp.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_translate_endpoint_returns_png(override_dependencies):
    async with create_client(fastapi_app) as client:
        resp = await client.post(
            "/api/translate",
            files={"file": ("test.png", make_image_bytes(), "image/png")},
            data={"source_lang": "auto", "target_lang": "zh", "field": "e-commerce"},
        )

        assert resp.status_code == HTTP_200_OK
        assert resp.headers["content-type"] == "image/png"


@pytest.mark.asyncio
async def test_translate_endpoint_rejects_invalid_file():
    async with create_client(fastapi_app) as client:
        resp = await client.post(
            "/api/translate",
            files={"file": ("bad.txt", b"hello", "text/plain")},
        )

        assert resp.status_code == HTTP_400_BAD_REQUEST
        assert resp.json()["error"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_translate_endpoint_uses_cache(override_dependencies):
    fake_translator = override_dependencies

    async with create_client(fastapi_app) as client:
        payload = {"file": ("test.png", make_image_bytes(), "image/png")}
        await client.post("/api/translate", files=payload)
        await client.post("/api/translate", files=payload)

    assert fake_translator.calls == 1

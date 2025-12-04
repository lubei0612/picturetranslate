from __future__ import annotations

from datetime import datetime
from io import BytesIO

import pytest
from fastapi import FastAPI
from PIL import Image
from starlette.status import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_204_NO_CONTENT,
    HTTP_400_BAD_REQUEST,
    HTTP_404_NOT_FOUND,
)

from api.dependencies import get_cache_service, get_history_service, get_job_queue_service, get_translator_service
from api.main import app as fastapi_app
from services.cache import CacheService
from models.job import JobStatus
from services.job_queue import JobCreateResult
from models.translation import TranslationStatus

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

    def translate(self, image_bytes, source_lang, target_lang, field, enable_postprocess, *, protect_product=None):  # type: ignore[override]
        self.calls += 1
        image = Image.new("RGB", (8, 8), color="purple")
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        return buffer.getvalue()


class FakeJobQueueService:
    def __init__(self):
        self.created_jobs = []

    async def create_job(self, files, masks, params):  # type: ignore[override]
        self.created_jobs.append(len(files))
        return JobCreateResult(job_id="job-123", status=JobStatus.PENDING, images_count=len(files))

    def job_exists(self, job_id: str) -> bool:
        return job_id == "job-123"


class FakeHistoryService:
    def __init__(self):
        self.records = [
            type(
                "Record",
                (),
                {
                    "id": "rec-1",
                    "job_id": "job-123",
                    "image_uuid": "img-1",
                    "source_lang": "en",
                    "target_lang": "zh",
                    "field": "e-commerce",
                    "status": TranslationStatus.DONE,
                    "created_at": datetime(2024, 1, 1, 0, 0, 0),
                    "original_path": "job-123/img-1/original.png",
                    "mask_path": None,
                    "result_path": "job-123/img-1/result.png",
                },
            )
        ]
        self.deleted = None

    def list_history(self, **kwargs):  # type: ignore[override]
        return self.records, len(self.records)

    def get_translation(self, translation_id: str):  # type: ignore[override]
        for record in self.records:
            if record.id == translation_id:
                return record
        raise AssertionError("record not found in fake service")

    def delete_translation(self, translation_id: str):  # type: ignore[override]
        self.deleted = translation_id


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


@pytest.mark.asyncio
async def test_jobs_endpoint_creates_job():
    fake_queue = FakeJobQueueService()
    fastapi_app.dependency_overrides[get_job_queue_service] = lambda: fake_queue

    async with create_client(fastapi_app) as client:
        files = [
            ("files", ("one.png", make_image_bytes(), "image/png")),
        ]
        resp = await client.post("/api/jobs", files=files)

    assert resp.status_code == HTTP_201_CREATED
    payload = resp.json()
    assert payload["job_id"] == "job-123"
    assert payload["images_count"] == 1
    assert fake_queue.created_jobs == [1]


@pytest.mark.asyncio
async def test_jobs_sse_requires_existing_job():
    fake_queue = FakeJobQueueService()
    fastapi_app.dependency_overrides[get_job_queue_service] = lambda: fake_queue

    async with create_client(fastapi_app) as client:
        resp = await client.get("/api/jobs/missing/sse")

    assert resp.status_code == HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_history_endpoints_use_service():
    fake_history = FakeHistoryService()
    fastapi_app.dependency_overrides[get_history_service] = lambda: fake_history

    async with create_client(fastapi_app) as client:
        list_resp = await client.get("/api/history")
        assert list_resp.status_code == HTTP_200_OK
        payload = list_resp.json()
        assert payload["total"] == 1
        assert payload["items"][0]["id"] == "rec-1"

        detail_resp = await client.get("/api/history/rec-1")
        assert detail_resp.status_code == HTTP_200_OK
        assert detail_resp.json()["job_id"] == "job-123"

        delete_resp = await client.delete("/api/history/rec-1")
        assert delete_resp.status_code == HTTP_204_NO_CONTENT
        assert fake_history.deleted == "rec-1"

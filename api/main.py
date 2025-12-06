"""FastAPI application entrypoint."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response

from api.dependencies import get_job_queue_service
from api.routes import engines, health, history, jobs, layers, translate
from core.config import settings
from core.database import init_db
from core.exceptions import register_exception_handlers

try:  # pragma: no cover - optional dependency
    from core.sentry import init_sentry
except ImportError:  # pragma: no cover
    init_sentry = None  # type: ignore[assignment]

try:  # pragma: no cover - optional module (configured in later phases)
    from services.cleanup import cleanup_service
except ImportError:  # pragma: no cover
    cleanup_service = None  # type: ignore[assignment]

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):  # pragma: no cover - lifecycle hook
    init_db()
    job_queue_service = get_job_queue_service()

    if init_sentry and settings.SENTRY_DSN:
        init_sentry(settings.SENTRY_DSN, settings.ENVIRONMENT)

    if cleanup_service:
        cleanup_service.schedule_cleanup()  # type: ignore[attr-defined]

    try:
        yield
    finally:
        if cleanup_service:
            try:
                cleanup_service.shutdown()  # type: ignore[attr-defined]
            except Exception as exc:  # pragma: no cover - defensive
                logger.warning("Failed to shutdown cleanup service: %s", exc)

        job_queue_service.shutdown()


def create_app() -> FastAPI:
    app = FastAPI(title="图片翻译 API", version="1.0.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(translate.router, prefix="/api")
    app.include_router(jobs.router, prefix="/api")
    app.include_router(history.router, prefix="/api")
    app.include_router(engines.router, prefix="/api")
    app.include_router(layers.router, prefix="/api")

    # 静态文件服务 (使用路由以支持 CORS)
    storage_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage")
    os.makedirs(storage_dir, exist_ok=True)

    @app.get("/storage/{path:path}")
    async def serve_storage(path: str):
        file_path = os.path.join(storage_dir, path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return Response(status_code=404)

    register_exception_handlers(app)
    return app


app = create_app()


__all__ = ["app", "create_app"]

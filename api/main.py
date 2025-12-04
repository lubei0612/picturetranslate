"""FastAPI application entrypoint."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import health, translate
from core.config import settings
from core.exceptions import register_exception_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):  # pragma: no cover - lifecycle hook
    yield


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

    register_exception_handlers(app)
    return app


app = create_app()


__all__ = ["app", "create_app"]

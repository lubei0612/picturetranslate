"""Application-level exceptions and FastAPI handlers."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class AppError(Exception):
    """Base application error with HTTP metadata."""

    status_code: int = 400
    error_code: str = "APP_ERROR"

    def __init__(self, message: str, *, error_code: str | None = None, status_code: int | None = None, details: Any | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.error_code = error_code or self.error_code
        self.status_code = status_code or self.status_code
        self.details = details

    def to_response(self) -> JSONResponse:
        payload: dict[str, Any] = {"error": self.error_code, "message": self.message}
        if self.details:
            payload["details"] = self.details
        return JSONResponse(status_code=self.status_code, content=payload)


class ValidationError(AppError):
    """Raised when user input fails validation."""

    status_code = 400
    error_code = "VALIDATION_ERROR"


class TranslationError(AppError):
    """Raised when downstream translation fails."""

    status_code = 502
    error_code = "TRANSLATION_ERROR"


class NotFoundError(AppError):
    """Raised when a resource cannot be located."""

    status_code = 404
    error_code = "NOT_FOUND"


class RateLimitError(AppError):
    """Raised when upstream limits are exceeded."""

    status_code = 429
    error_code = "RATE_LIMITED"


def register_exception_handlers(app: FastAPI) -> None:
    """Register custom FastAPI exception handlers."""

    @app.exception_handler(AppError)
    async def _app_error_handler(request: Request, exc: AppError):  # type: ignore[unused-ignore]
        logger.warning("AppError: %s %s", exc.error_code, exc.message)
        return exc.to_response()

    @app.exception_handler(RequestValidationError)
    async def _request_validation_handler(request: Request, exc: RequestValidationError):  # type: ignore[unused-ignore]
        logger.info("Request validation failed: %s", exc.errors())
        return JSONResponse(
            status_code=422,
            content={
                "error": "REQUEST_VALIDATION_ERROR",
                "message": "请求参数不合法",
                "details": exc.errors(),
            },
        )

    @app.exception_handler(Exception)
    async def _unhandled_handler(request: Request, exc: Exception):  # type: ignore[unused-ignore]
        logger.exception("Unhandled exception: %s", exc)
        return JSONResponse(
            status_code=500,
            content={
                "error": "INTERNAL_SERVER_ERROR",
                "message": "服务器开小差，请稍后再试",
            },
        )


__all__ = [
    "AppError",
    "ValidationError",
    "TranslationError",
    "NotFoundError",
    "RateLimitError",
    "register_exception_handlers",
]

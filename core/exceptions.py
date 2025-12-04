"""Application-level exceptions and FastAPI handlers."""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class TranslationError(Exception):
    """Raised when downstream translation fails."""

    def __init__(self, message: str, code: str = "TRANSLATION_ERROR") -> None:
        super().__init__(message)
        self.code = code
        self.message = message


class ValidationError(Exception):
    """Raised when user input fails validation."""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


def register_exception_handlers(app: FastAPI) -> None:
    """Register custom FastAPI exception handlers."""

    @app.exception_handler(TranslationError)
    async def _translation_handler(request: Request, exc: TranslationError):  # type: ignore[unused-ignore]
        return JSONResponse(
            status_code=500,
            content={"error": exc.code, "message": exc.message},
        )

    @app.exception_handler(ValidationError)
    async def _validation_handler(request: Request, exc: ValidationError):  # type: ignore[unused-ignore]
        return JSONResponse(
            status_code=400,
            content={"error": "VALIDATION_ERROR", "message": exc.message},
        )


__all__ = [
    "TranslationError",
    "ValidationError",
    "register_exception_handlers",
]

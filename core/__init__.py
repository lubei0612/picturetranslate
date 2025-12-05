"""Core package exports for configuration and exception handling."""

from .config import Settings, settings
from .exceptions import (
    AppError,
    NotFoundError,
    RateLimitError,
    TranslationError,
    ValidationError,
    register_exception_handlers,
)

__all__ = [
    "Settings",
    "settings",
    "AppError",
    "ValidationError",
    "TranslationError",
    "NotFoundError",
    "RateLimitError",
    "register_exception_handlers",
]

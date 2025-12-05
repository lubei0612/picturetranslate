"""Translation engine strategy registry and helpers."""

from __future__ import annotations

from .base import TranslateEngine, TranslateResult
from .registry import EngineRegistry


def register_engine(engine: TranslateEngine, *, default: bool = False) -> None:
    """Register a translation engine instance with the global registry."""

    EngineRegistry.register(engine, default=default)


def get_engine(name: str) -> TranslateEngine:
    """Convenience wrapper around :meth:`EngineRegistry.get`."""

    return EngineRegistry.get(name)


def list_available_engines() -> list[str]:
    """Return the list of currently healthy engines."""

    return EngineRegistry.list_available()


__all__ = [
    "EngineRegistry",
    "TranslateEngine",
    "TranslateResult",
    "register_engine",
    "get_engine",
    "list_available_engines",
]


# Ensure built-in engines are registered on import
from . import aliyun  # noqa: F401,E402

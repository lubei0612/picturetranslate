"""Dependency injection helpers for FastAPI routes."""

from __future__ import annotations

from functools import lru_cache

from services.cache import CacheService
from services.translator import TranslatorService


@lru_cache(maxsize=1)
def _translator_singleton() -> TranslatorService:
    return TranslatorService()


@lru_cache(maxsize=1)
def _cache_singleton() -> CacheService:
    return CacheService()


def get_translator_service() -> TranslatorService:
    return _translator_singleton()


def get_cache_service() -> CacheService:
    return _cache_singleton()


__all__ = ["get_translator_service", "get_cache_service"]

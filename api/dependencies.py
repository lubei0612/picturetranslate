"""Dependency injection helpers for FastAPI routes."""

from __future__ import annotations

from functools import lru_cache

from core.database import SessionLocal
from services.cache import CacheService
from services.cleanup import CleanupService, cleanup_service
from services.history import HistoryService
from services.job_queue import JobQueueService
from services.sse_manager import sse_manager
from services.storage import StorageService
from services.translator import TranslatorService


@lru_cache(maxsize=1)
def _translator_singleton() -> TranslatorService:
    return TranslatorService()


@lru_cache(maxsize=1)
def _cache_singleton() -> CacheService:
    return CacheService()


@lru_cache(maxsize=1)
def _storage_singleton() -> StorageService:
    return StorageService()


@lru_cache(maxsize=1)
def _job_queue_singleton() -> JobQueueService:
    return JobQueueService(
        session_factory=SessionLocal,
        storage_service=_storage_singleton(),
        translator_factory=lambda: get_translator_service(),
        sse_manager=sse_manager,
    )


@lru_cache(maxsize=1)
def _history_singleton() -> HistoryService:
    return HistoryService(session_factory=SessionLocal, storage_service=_storage_singleton())


def get_translator_service() -> TranslatorService:
    return _translator_singleton()


def get_cache_service() -> CacheService:
    return _cache_singleton()


def get_storage_service() -> StorageService:
    return _storage_singleton()


def get_job_queue_service() -> JobQueueService:
    return _job_queue_singleton()


def get_history_service() -> HistoryService:
    return _history_singleton()


def get_cleanup_service() -> CleanupService:
    return cleanup_service


__all__ = [
    "get_translator_service",
    "get_cache_service",
    "get_storage_service",
    "get_job_queue_service",
    "get_history_service",
    "get_cleanup_service",
]

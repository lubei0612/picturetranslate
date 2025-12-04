"""Thread-safe LRU cache service."""

from __future__ import annotations

import threading
import time
from collections import OrderedDict

from core.config import settings


class CacheService:
    """Simple in-memory LRU cache with TTL semantics."""

    def __init__(self) -> None:
        self._cache: OrderedDict[str, tuple[bytes, float]] = OrderedDict()
        self._lock = threading.Lock()
        self._max_size = settings.CACHE_MAX_SIZE
        self._ttl = settings.CACHE_TTL

    def get(self, key: str) -> bytes | None:
        with self._lock:
            item = self._cache.get(key)
            if item is None:
                return None

            value, timestamp = item
            if time.time() - timestamp > self._ttl:
                del self._cache[key]
                return None

            self._cache.move_to_end(key)
            return value

    def set(self, key: str, value: bytes) -> None:
        with self._lock:
            if key in self._cache:
                self._cache.move_to_end(key)

            self._cache[key] = (value, time.time())

            while len(self._cache) > self._max_size:
                self._cache.popitem(last=False)


__all__ = ["CacheService"]

"""Thread-safe LRU cache service with TTL support."""

from __future__ import annotations

import threading
import time
from collections import OrderedDict
from dataclasses import dataclass
from typing import Dict

from core.config import settings


@dataclass
class CacheEntry:
    value: bytes
    stored_at: float


class CacheService:
    """Simple in-memory LRU cache with TTL semantics."""

    def __init__(self, *, max_size: int | None = None, ttl: int | None = None) -> None:
        self._cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self._lock = threading.Lock()
        self._max_size = max_size or settings.CACHE_MAX_SIZE
        self._ttl = ttl or settings.CACHE_TTL

    def get(self, key: str) -> bytes | None:
        with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                return None

            if self._is_expired(entry):
                del self._cache[key]
                return None

            self._cache.move_to_end(key)
            return entry.value

    def set(self, key: str, value: bytes) -> None:
        with self._lock:
            self._cache[key] = CacheEntry(value=value, stored_at=time.time())
            self._cache.move_to_end(key)
            self._evict_if_needed()

    def delete(self, key: str) -> None:
        with self._lock:
            self._cache.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()

    def snapshot(self) -> Dict[str, float]:
        """Return a shallow copy of keys with their age (seconds)."""
        now = time.time()
        with self._lock:
            return {key: now - entry.stored_at for key, entry in self._cache.items()}

    def _is_expired(self, entry: CacheEntry) -> bool:
        return time.time() - entry.stored_at > self._ttl

    def _evict_if_needed(self) -> None:
        while len(self._cache) > self._max_size:
            self._cache.popitem(last=False)


__all__ = ["CacheService", "CacheEntry"]

"""Async SSE pub/sub manager."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Dict, Set


@dataclass
class SSEEvent:
    event: str
    data: dict


class SSEManager:
    """Pub/Sub manager that fans out events to subscribers per job."""

    def __init__(self) -> None:
        self._subscribers: Dict[str, Set[asyncio.Queue]] = {}
        self._lock = asyncio.Lock()

    async def subscribe(self, job_id: str) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        async with self._lock:
            self._subscribers.setdefault(job_id, set()).add(queue)
        return queue

    async def unsubscribe(self, job_id: str, queue: asyncio.Queue) -> None:
        async with self._lock:
            if job_id in self._subscribers:
                self._subscribers[job_id].discard(queue)
                if not self._subscribers[job_id]:
                    self._subscribers.pop(job_id, None)

    async def publish(self, job_id: str, event: SSEEvent) -> None:
        async with self._lock:
            subscribers = list(self._subscribers.get(job_id, set()))
        for queue in subscribers:
            await queue.put(event)


sse_manager = SSEManager()


__all__ = ["sse_manager", "SSEManager", "SSEEvent"]

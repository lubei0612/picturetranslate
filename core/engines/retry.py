"""Async retry utilities dedicated to translation engines."""

from __future__ import annotations

import asyncio
import logging
import random
from functools import wraps
from typing import Any, Awaitable, Callable, TypeVar


logger = logging.getLogger(__name__)

F = TypeVar("F", bound=Callable[..., Awaitable[Any]])


def async_retry(
    *,
    max_attempts: int = 3,
    base_delay: float = 0.5,
    jitter: float = 0.3,
    exceptions: tuple[type[BaseException], ...] = (Exception,),
    log: logging.Logger | None = None,
) -> Callable[[F], F]:
    """Retry decorator with exponential backoff for async callables."""

    active_logger = log or logger

    def decorator(func: F) -> F:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any):  # type: ignore[misc]
            last_error: BaseException | None = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return await func(*args, **kwargs)
                except exceptions as exc:  # type: ignore[misc]
                    last_error = exc
                    active_logger.warning(
                        "Engine call failed (%s/%s): %s", attempt, max_attempts, exc
                    )
                    if attempt >= max_attempts:
                        raise
                    delay = base_delay * (2 ** (attempt - 1))
                    if jitter > 0:
                        delay += random.uniform(0, jitter)
                    await asyncio.sleep(delay)
            assert last_error is not None
            raise last_error

        return wrapper  # type: ignore[return-value]

    return decorator


__all__ = ["async_retry"]

"""Retry helper decorator with sync/async support."""

from __future__ import annotations

import asyncio
import logging
import random
import time
from functools import wraps
from typing import Any, Callable, Optional, Tuple, Type, TypeVar


logger = logging.getLogger(__name__)

F = TypeVar("F", bound=Callable[..., Any])


def retry_on_failure(
    max_attempts: int = 3,
    delay: float = 1.0,
    *,
    exceptions: Tuple[Type[BaseException], ...] = (Exception,),
    backoff: str = "exponential",
    jitter: float = 0.0,
    logger_override: Optional[logging.Logger] = None,
) -> Callable[[F], F]:
    """Retry decorator supporting sync/async callables.

    Args:
        max_attempts: Maximum number of executions before surfacing error.
        delay: Base delay (seconds) between attempts.
        exceptions: Tuple of exception types that should trigger a retry.
        backoff: "linear" or "exponential" multiplier strategy.
        jitter: Optional random jitter (seconds) added to each delay.
        logger_override: Custom logger instance; defaults to module logger.
    """

    active_logger = logger_override or logger

    def _sleep_duration(attempt: int) -> float:
        if backoff == "linear":
            base = delay * attempt
        else:
            base = delay * (2 ** (attempt - 1))
        if jitter > 0:
            base += random.uniform(0, jitter)
        return base

    def decorator(func: F) -> F:
        is_coroutine = asyncio.iscoroutinefunction(func)

        @wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any):  # type: ignore[misc]
            last_error: Optional[BaseException] = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return await func(*args, **kwargs)
                except exceptions as exc:  # type: ignore[misc]
                    last_error = exc
                    active_logger.warning(
                        "Attempt %s/%s failed: %s", attempt, max_attempts, exc
                    )
                    if attempt >= max_attempts:
                        raise
                    await asyncio.sleep(_sleep_duration(attempt))
            assert last_error is not None
            raise last_error

        @wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any):
            last_error: Optional[BaseException] = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as exc:  # type: ignore[misc]
                    last_error = exc
                    active_logger.warning(
                        "Attempt %s/%s failed: %s", attempt, max_attempts, exc
                    )
                    if attempt >= max_attempts:
                        raise
                    time.sleep(_sleep_duration(attempt))
            assert last_error is not None
            raise last_error

        return (async_wrapper if is_coroutine else sync_wrapper)  # type: ignore[return-value]

    return decorator


__all__ = ["retry_on_failure"]

"""Retry helper decorator."""

from __future__ import annotations

import logging
import time
from functools import wraps
from typing import Any, Callable, TypeVar


logger = logging.getLogger(__name__)

F = TypeVar("F", bound=Callable[..., Any])


def retry_on_failure(max_attempts: int = 3, delay: float = 1.0) -> Callable[[F], F]:
    """Retry decorator with simple linear backoff."""

    def decorator(func: F) -> F:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any):
            last_error: Exception | None = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as exc:  # pragma: no cover - depends on downstream
                    last_error = exc
                    logger.warning("Attempt %s/%s failed: %s", attempt, max_attempts, exc)
                    if attempt < max_attempts:
                        time.sleep(delay * attempt)
            assert last_error is not None
            raise last_error

        return wrapper  # type: ignore[return-value]

    return decorator


__all__ = ["retry_on_failure"]

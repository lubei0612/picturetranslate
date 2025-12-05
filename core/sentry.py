"""Sentry initialization utilities for FastAPI and background services."""

from __future__ import annotations

import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)

try:  # pragma: no cover - optional dependency
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.logging import LoggingIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
except ImportError:  # pragma: no cover - graceful fallback when SDK missing
    sentry_sdk = None  # type: ignore[assignment]
    FastApiIntegration = None  # type: ignore[assignment]
    LoggingIntegration = None  # type: ignore[assignment]
    SqlalchemyIntegration = None  # type: ignore[assignment]


def init_sentry(dsn: str, environment: str, *, traces_sample_rate: float = 0.1, profiles_sample_rate: float = 0.1) -> None:
    """Initialize Sentry SDK if available."""

    if not dsn:
        logger.debug("Sentry DSN not configured; skipping initialization")
        return

    if sentry_sdk is None:  # pragma: no cover - depends on optional dependency
        logger.warning("sentry-sdk not installed; skipping Sentry initialization")
        return

    integrations = [
        FastApiIntegration(transaction_style="endpoint"),
        SqlalchemyIntegration(),
        LoggingIntegration(level=logging.INFO, event_level=logging.ERROR),
    ]

    sentry_sdk.init(
        dsn=dsn,
        environment=environment,
        integrations=integrations,
        traces_sample_rate=traces_sample_rate,
        profiles_sample_rate=profiles_sample_rate,
        send_default_pii=False,
    )
    logger.info("Sentry initialized for environment %s", environment)


__all__ = ["init_sentry"]

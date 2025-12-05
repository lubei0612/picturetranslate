"""Engine registry with circuit breaker + fallback orchestration."""

from __future__ import annotations

import asyncio
import logging
from collections import defaultdict
from typing import Iterable, Sequence

from core.engines.base import TranslateEngine, TranslateResult
from core.exceptions import EngineUnavailableError


logger = logging.getLogger(__name__)


class EngineRegistry:
    """Simple in-memory registry that keeps track of healthy engines."""

    FAILURE_THRESHOLD = 3

    _engines: dict[str, TranslateEngine] = {}
    _failure_counters: dict[str, int] = defaultdict(int)
    _health_state: dict[str, bool] = {}
    _lock: asyncio.Lock = asyncio.Lock()
    _default_engine: str | None = None

    @classmethod
    def register(cls, engine: TranslateEngine, *, default: bool = False) -> None:
        if engine.name in cls._engines:
            logger.warning("Engine %s 已存在，将被覆盖", engine.name)
        cls._engines[engine.name] = engine
        cls._failure_counters[engine.name] = 0
        cls._health_state[engine.name] = True
        if default or cls._default_engine is None:
            cls._default_engine = engine.name
        logger.info("Registered translation engine: %s", engine.name)

    @classmethod
    def get(cls, name: str) -> TranslateEngine:
        try:
            engine = cls._engines[name]
        except KeyError as exc:  # pragma: no cover - defensive
            raise EngineUnavailableError(f"找不到翻译引擎 {name}") from exc
        return engine

    @classmethod
    def list_registered(cls) -> list[str]:
        return list(cls._engines.keys())

    @classmethod
    def list_available(cls) -> list[str]:
        return [name for name, healthy in cls._health_state.items() if healthy]

    @classmethod
    def is_available(cls, name: str) -> bool:
        return cls._health_state.get(name, True)

    @classmethod
    def get_default(cls) -> str:
        if cls._default_engine and cls._default_engine in cls._engines:
            return cls._default_engine
        if cls._engines:
            return next(iter(cls._engines))
        raise EngineUnavailableError("尚未注册任何翻译引擎")

    @classmethod
    def describe_engines(cls) -> list[dict[str, object]]:
        descriptions: list[dict[str, object]] = []
        for name, engine in cls._engines.items():
            descriptions.append(
                {
                    "name": name,
                    "display_name": getattr(engine, "display_name", name),
                    "available": cls.is_available(name),
                }
            )
        return descriptions

    @classmethod
    async def translate_with_fallback(
        cls,
        *,
        preferred: str | None = None,
        candidates: Sequence[str] | None = None,
        **translate_kwargs,
    ) -> TranslateResult:
        """Attempt translation with fallback between healthy engines."""

        engine_order = cls._build_priority_queue(preferred, candidates)
        last_error: Exception | None = None

        for engine_name in engine_order:
            engine = cls._engines.get(engine_name)
            if engine is None:
                continue
            if not cls._health_state.get(engine_name, True):
                logger.warning("Skip engine %s (unhealthy)", engine_name)
                continue
            try:
                result = await engine.translate(**translate_kwargs)
                await cls._mark_success(engine_name)
                return result
            except Exception as exc:  # pragma: no cover - depends on SDK
                await cls._mark_failure(engine_name, exc)
                last_error = exc
                continue

        raise EngineUnavailableError(
            "所有翻译引擎暂不可用，请稍后重试",
            details={"lastError": str(last_error) if last_error else None},
        )

    @classmethod
    async def _mark_success(cls, engine_name: str) -> None:
        async with cls._lock:
            cls._failure_counters[engine_name] = 0
            cls._health_state[engine_name] = True

    @classmethod
    async def _mark_failure(cls, engine_name: str, exc: Exception) -> None:
        async with cls._lock:
            cls._failure_counters[engine_name] += 1
            failure_count = cls._failure_counters[engine_name]
            logger.error(
                "Engine %s failed (%s/%s): %s",
                engine_name,
                failure_count,
                cls.FAILURE_THRESHOLD,
                exc,
            )
            if failure_count >= cls.FAILURE_THRESHOLD:
                cls._health_state[engine_name] = False
                logger.error("Engine %s marked unhealthy due to repeated failures", engine_name)

    @classmethod
    async def revive(cls, engine_name: str) -> None:
        """Manually mark an engine healthy (e.g., after passing health check)."""

        async with cls._lock:
            if engine_name in cls._engines:
                cls._failure_counters[engine_name] = 0
                cls._health_state[engine_name] = True

    @classmethod
    async def probe_health(cls) -> dict[str, bool]:
        """Run health checks for all registered engines."""

        results: dict[str, bool] = {}
        for name, engine in cls._engines.items():
            try:
                healthy = await engine.health_check()
            except Exception as exc:  # pragma: no cover - depends on SDK
                logger.exception("Health check failed for %s: %s", name, exc)
                healthy = False
            results[name] = healthy
            async with cls._lock:
                cls._health_state[name] = healthy
                if healthy:
                    cls._failure_counters[name] = 0
        return results

    @classmethod
    def _build_priority_queue(
        cls, preferred: str | None, candidates: Sequence[str] | None
    ) -> list[str]:
        if candidates:
            ordered = list(candidates)
        else:
            ordered = list(cls._engines.keys())

        if preferred and preferred in cls._engines:
            ordered = [preferred] + [name for name in ordered if name != preferred]
        elif cls._default_engine and cls._default_engine in cls._engines:
            ordered = [cls._default_engine] + [name for name in ordered if name != cls._default_engine]
        return ordered


__all__ = ["EngineRegistry"]

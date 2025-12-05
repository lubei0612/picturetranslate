"""Engine metadata endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from api.schemas import EngineInfo, EngineListResponse
from core.engines import EngineRegistry
from core.exceptions import EngineUnavailableError


router = APIRouter(tags=["engines"])


@router.get("/engines", response_model=EngineListResponse)
async def list_engines() -> EngineListResponse:
    descriptions = EngineRegistry.describe_engines()
    if not descriptions:
        raise EngineUnavailableError("暂未注册任何翻译引擎")

    default_engine = EngineRegistry.get_default()
    engines = [
        EngineInfo(
            name=desc["name"],
            display_name=desc["display_name"],
            available=bool(desc["available"]),
        )
        for desc in descriptions
    ]
    return EngineListResponse(engines=engines, default=default_engine)


__all__ = ["router", "list_engines"]

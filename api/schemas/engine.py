"""Engine metadata schemas."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


def _to_camel(string: str) -> str:
    parts = string.split("_")
    return parts[0] + "".join(word.capitalize() for word in parts[1:]) if len(parts) > 1 else string


class _CamelModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=_to_camel, extra="forbid")


class EngineInfo(_CamelModel):
    name: str = Field(..., min_length=1)
    display_name: str = Field(..., min_length=1)
    available: bool = Field(default=True)


class EngineListResponse(_CamelModel):
    engines: list[EngineInfo] = Field(default_factory=list)
    default: str = Field(..., min_length=1)


__all__ = ["EngineInfo", "EngineListResponse"]

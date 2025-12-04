"""Batch job related schemas."""

from __future__ import annotations

from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


def _to_camel(string: str) -> str:
    parts = string.split("_")
    return parts[0] + "".join(word.capitalize() for word in parts[1:]) if len(parts) > 1 else string


class _CamelModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=_to_camel, extra="forbid")


class JobStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class JobCreate(_CamelModel):
    source_lang: str = Field(..., min_length=1)
    target_lang: str = Field(..., min_length=1)
    field: str = Field(default="e-commerce", min_length=1)
    enable_postprocess: bool = Field(default=True)
    protect_product: Optional[bool] = Field(default=True)


class JobResponse(_CamelModel):
    job_id: str = Field(..., min_length=1)
    status: JobStatus
    progress: Optional[float] = Field(default=None, ge=0, le=100)
    result: Optional[Any] = None
    error: Optional[str] = None


__all__ = ["JobStatus", "JobCreate", "JobResponse"]

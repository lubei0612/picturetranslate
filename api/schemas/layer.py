"""Pydantic schemas for text layer APIs."""

from __future__ import annotations

from typing import Annotated, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


def _to_camel(string: str) -> str:
    parts = string.split("_")
    return parts[0] + "".join(word.capitalize() for word in parts[1:]) if len(parts) > 1 else string


class _CamelModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=_to_camel, extra="forbid")


BoundingBox = Annotated[
    tuple[float, float, float, float],
    Field(..., min_length=4, max_length=4, description="[x, y, width, height]"),
]


class LayerStyle(_CamelModel):
    font_family: str = Field(..., min_length=1)
    font_size: float = Field(..., gt=0)
    font_color: str = Field(..., min_length=4)
    background_color: Optional[str] = Field(default=None)
    rotation: float = Field(..., ge=-360, le=360)


class LayerStyleUpdate(_CamelModel):
    font_family: Optional[str] = None
    font_size: Optional[float] = Field(default=None, gt=0)
    font_color: Optional[str] = None
    background_color: Optional[str] = None
    rotation: Optional[float] = Field(default=None, ge=-360, le=360)

    @model_validator(mode="after")
    def _ensure_changes(cls, values: "LayerStyleUpdate") -> "LayerStyleUpdate":
        if not any(
            [
                values.font_family,
                values.font_size is not None,
                values.font_color,
                values.background_color,
                values.rotation is not None,
            ]
        ):
            raise ValueError("必须至少提供一个样式字段")
        return values


class TextLayerBase(_CamelModel):
    translation_id: str = Field(..., min_length=1)
    bbox: BoundingBox
    original_text: str = Field(..., min_length=1)
    translated_text: str = Field(..., min_length=1)
    style: LayerStyle
    version: int = Field(1, ge=1)


class TextLayerCreate(TextLayerBase):
    pass


class TextLayerUpdate(_CamelModel):
    translated_text: Optional[str] = None
    style: Optional[LayerStyleUpdate] = None
    version: int = Field(..., ge=1)

    @model_validator(mode="after")
    def _ensure_payload(cls, values: "TextLayerUpdate") -> "TextLayerUpdate":
        if values.translated_text is None and values.style is None:
            raise ValueError("必须提供译文或样式更新")
        return values


class TextLayerBatchUpdateItem(_CamelModel):
    id: str = Field(..., min_length=1)
    translated_text: Optional[str] = None
    style: Optional[LayerStyleUpdate] = None
    version: int = Field(..., ge=1)

    @model_validator(mode="after")
    def _ensure_changes(cls, values: "TextLayerBatchUpdateItem") -> "TextLayerBatchUpdateItem":
        if values.translated_text is None and values.style is None:
            raise ValueError("必须提供译文或样式更新")
        return values


class TextLayerBatchUpdateRequest(_CamelModel):
    translation_id: str = Field(..., min_length=1)
    layers: list[TextLayerBatchUpdateItem] = Field(..., min_length=1)


class TextLayerResponse(TextLayerBase):
    id: str = Field(..., min_length=1)


DEFAULT_LAYER_STYLE = LayerStyle(
    font_family="Arial",
    font_size=14,
    font_color="#000000",
    rotation=0,
)


__all__ = [
    "BoundingBox",
    "LayerStyle",
    "LayerStyleUpdate",
    "TextLayerBase",
    "TextLayerCreate",
    "TextLayerUpdate",
    "TextLayerBatchUpdateItem",
    "TextLayerBatchUpdateRequest",
    "TextLayerResponse",
    "DEFAULT_LAYER_STYLE",
]

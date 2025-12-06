"""Abstractions shared by all translation engines."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Mapping, Optional

from pydantic import BaseModel, ConfigDict, Field


class TranslateResult(BaseModel):
    """Normalized payload returned by every translation engine."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    engine_name: str = Field(..., description="唯一的引擎名称，用于审计和回退")
    translated_image: Optional[bytes] = Field(
        default=None,
        description="翻译完成后的图片二进制（PNG/JPEG），若为空表示只返回图层数据",
    )
    layers: list[dict[str, Any]] = Field(
        default_factory=list,
        description="图层原始数据，后续会映射至 TextLayer ORM",
    )
    editor_data: Optional[str] = Field(
        default=None,
        description="阿里云编辑器图层 JSON（用于 iframe 编辑器）",
    )
    inpainting_url: Optional[str] = Field(
        default=None,
        description="擦除文字后的背景图 URL",
    )
    metadata: Optional[Mapping[str, Any]] = Field(
        default=None,
        description="可选的附加信息，如请求 ID、耗时等",
    )


class TranslateEngine(ABC):
    """Strategy interface for vendor-specific translation engines."""

    #: 子类必须覆盖的唯一引擎名称（如 "aliyun"、"google" 等）
    name: str
    #: 可选的展示名称，默认等于 name
    display_name: str

    def __init__(self) -> None:
        if not getattr(self, "name", None):  # pragma: no cover - defensive
            raise ValueError("TranslateEngine 子类必须定义 name 属性")
        if not getattr(self, "display_name", None):
            self.display_name = self.name

    @abstractmethod
    async def translate(
        self,
        *,
        image: bytes,
        source_lang: str,
        target_lang: str,
        field: str,
        enable_postprocess: bool = True,
        mask: Optional[bytes] = None,
        protect_product: Optional[bool] = None,
    ) -> TranslateResult:
        """Execute translation and return a normalized result payload."""

    @abstractmethod
    async def health_check(self) -> bool:
        """Return True when the engine is ready to accept traffic."""

    async def warm_up(self) -> None:
        """Optional hook for eager initialization (default: noop)."""

        return None


__all__ = ["TranslateEngine", "TranslateResult"]

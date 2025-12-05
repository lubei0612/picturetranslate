"""TextLayer ORM model representing editable translation layers."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class TextLayer(Base):
    __tablename__ = "text_layers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    translation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("translations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    bbox: Mapped[list[float]] = mapped_column(JSON, nullable=False)
    original_text: Mapped[str] = mapped_column(String(1024), nullable=False)
    translated_text: Mapped[str] = mapped_column(String(1024), nullable=False)
    style: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    translation = relationship("Translation", back_populates="layers")

    def increment_version(self) -> None:
        self.version += 1


__all__ = ["TextLayer"]

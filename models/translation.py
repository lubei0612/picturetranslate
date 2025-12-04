"""Translation ORM model."""

from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum as SQLEnum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base

if TYPE_CHECKING:  # pragma: no cover - typing only
    from .text_layer import TextLayer


class TranslationStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    DONE = "done"
    FAILED = "failed"


class Translation(Base):
    """Represents a single image translation task."""

    __tablename__ = "translations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id: Mapped[str] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    image_uuid: Mapped[str] = mapped_column(String(36), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    original_path: Mapped[str] = mapped_column(String(255), nullable=False)
    mask_path: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    result_path: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    source_lang: Mapped[str] = mapped_column(String(32), nullable=False)
    target_lang: Mapped[str] = mapped_column(String(32), nullable=False)
    field: Mapped[str] = mapped_column(String(64), nullable=False, default="e-commerce")
    enable_postprocess: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    protect_product: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    status: Mapped[TranslationStatus] = mapped_column(
        SQLEnum(TranslationStatus, name="translation_status", native_enum=False),
        default=TranslationStatus.PENDING,
        nullable=False,
        index=True,
    )
    error_message: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    job: Mapped["Job"] = relationship("Job", back_populates="translations")
    layers: Mapped[List["TextLayer"]] = relationship(
        "TextLayer",
        back_populates="translation",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"<Translation id={self.id} job={self.job_id} status={self.status}>"


__all__ = ["Translation", "TranslationStatus"]

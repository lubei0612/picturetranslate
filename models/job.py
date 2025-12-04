"""Job ORM model."""

from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import List, TYPE_CHECKING

from sqlalchemy import DateTime, Enum as SQLEnum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base

if TYPE_CHECKING:  # pragma: no cover - typing only
    from .translation import Translation


class JobStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    DONE = "done"
    FAILED = "failed"


class Job(Base):
    """Represents a batch translation job."""

    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    status: Mapped[JobStatus] = mapped_column(
        SQLEnum(JobStatus, name="job_status", native_enum=False),
        default=JobStatus.PENDING,
        nullable=False,
    )
    images_count: Mapped[int] = mapped_column(Integer, nullable=False)
    completed_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    failed_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    translations: Mapped[List["Translation"]] = relationship(
        "Translation",
        back_populates="job",
        cascade="all, delete-orphan",
    )

    def mark_processing(self) -> None:
        if self.status == JobStatus.PENDING:
            self.status = JobStatus.PROCESSING

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"<Job id={self.id} status={self.status} images={self.images_count}>"


__all__ = ["Job", "JobStatus"]

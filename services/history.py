"""History service for listing and pruning translations."""

from __future__ import annotations

from datetime import datetime
from typing import Callable, List, Optional, Tuple

from sqlalchemy import and_
from sqlalchemy.orm import Session

from core.database import SessionLocal
from core.exceptions import NotFoundError
from models import Job, Translation
from services.storage import StorageService


class HistoryService:
    """Provides paginated access to translation history."""

    def __init__(
        self,
        session_factory: Callable[[], Session] = SessionLocal,
        storage_service: Optional[StorageService] = None,
    ) -> None:
        self._session_factory = session_factory
        self._storage = storage_service or StorageService()

    def list_history(
        self,
        *,
        page: int = 1,
        limit: int = 20,
        source_lang: Optional[str] = None,
        target_lang: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> Tuple[List[Translation], int]:
        session = self._session_factory()
        try:
            query = session.query(Translation).order_by(Translation.created_at.desc())

            if source_lang:
                query = query.filter(Translation.source_lang == source_lang)
            if target_lang:
                query = query.filter(Translation.target_lang == target_lang)
            if date_from:
                query = query.filter(Translation.created_at >= date_from)
            if date_to:
                query = query.filter(Translation.created_at <= date_to)

            total = query.count()
            items = (
                query.offset(max(page - 1, 0) * limit)
                .limit(limit)
                .all()
            )

            for translation in items:
                session.expunge(translation)

            return items, total
        finally:
            session.close()

    def get_translation(self, translation_id: str) -> Translation:
        with self._session_factory() as session:
            translation = session.get(Translation, translation_id)
            if not translation:
                raise NotFoundError("记录不存在")
            session.expunge(translation)
            return translation

    def delete_translation(self, translation_id: str) -> None:
        session = self._session_factory()
        try:
            translation = session.get(Translation, translation_id)
            if not translation:
                raise NotFoundError("记录不存在")

            job_id = translation.job_id
            image_uuid = translation.image_uuid
            session.delete(translation)
            session.commit()

            self._storage.delete_image_files(job_id, image_uuid)

            self._cleanup_orphaned_job(job_id)
        finally:
            session.close()

    def _cleanup_orphaned_job(self, job_id: str) -> None:
        with self._session_factory() as session:
            job = session.get(Job, job_id)
            if job and not job.translations:
                session.delete(job)
                session.commit()
                self._storage.delete_job_files(job_id)


__all__ = ["HistoryService"]

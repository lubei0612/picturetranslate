"""Scheduled cleanup service for old translations."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional

from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session

from core.config import settings
from core.database import SessionLocal
from models import Job, Translation
from services.storage import StorageService

logger = logging.getLogger(__name__)


class CleanupService:
    """Removes translations older than retention window."""

    def __init__(
        self,
        session_factory=SessionLocal,
        storage_service: Optional[StorageService] = None,
    ) -> None:
        self._session_factory = session_factory
        self._storage = storage_service or StorageService()
        self._scheduler: Optional[AsyncIOScheduler] = None

    def schedule_cleanup(self) -> None:
        if self._scheduler:
            return

        jobstores = {"default": SQLAlchemyJobStore(url=settings.database_url)}
        executors = {"default": ThreadPoolExecutor(max_workers=1)}
        job_defaults = {"coalesce": True, "max_instances": 1, "misfire_grace_time": 3600}

        self._scheduler = AsyncIOScheduler(
            jobstores=jobstores,
            executors=executors,
            job_defaults=job_defaults,
            timezone="Asia/Shanghai",
        )

        self._scheduler.add_job(
            self.run_cleanup,
            "cron",
            hour=3,
            minute=0,
            id="daily_cleanup",
            replace_existing=True,
        )
        self._scheduler.start()
        logger.info("Cleanup scheduler started")

    async def run_cleanup(self) -> int:
        return await asyncio.to_thread(self._cleanup_impl)

    def _cleanup_impl(self) -> int:
        threshold = datetime.utcnow() - timedelta(days=settings.CLEANUP_RETENTION_DAYS)
        session: Session = self._session_factory()
        deleted = 0
        try:
            translations = (
                session.query(Translation)
                .filter(Translation.created_at < threshold)
                .all()
            )
            for translation in translations:
                self._storage.delete_image_files(translation.job_id, translation.image_uuid)
                session.delete(translation)
                deleted += 1

            session.commit()

            empty_jobs = session.query(Job).filter(~Job.translations.any()).all()
            for job in empty_jobs:
                session.delete(job)
                self._storage.delete_job_files(job.id)
            session.commit()
            return deleted
        finally:
            session.close()

    def shutdown(self) -> None:
        if self._scheduler:
            self._scheduler.shutdown(wait=False)
            self._scheduler = None


cleanup_service = CleanupService()


__all__ = ["CleanupService", "cleanup_service"]

"""SQLite-backed job queue and worker service."""

from __future__ import annotations

import asyncio
import logging
import uuid
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import datetime
from typing import Callable, List, Sequence

from fastapi import UploadFile
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from core.config import settings
from core.database import SessionLocal
from core.exceptions import ValidationError
from models import Job, JobStatus, Translation, TranslationStatus
from services.sse_manager import SSEEvent, SSEManager
from services.storage import StorageService
from services.translator import TranslateParams, TranslatorService
from utils.image import validate_image

logger = logging.getLogger(__name__)


@dataclass
class JobCreateResult:
    job_id: str
    status: JobStatus
    images_count: int


class JobQueueService:
    """Manage job creation and background translation workers."""

    def __init__(
        self,
        session_factory: Callable[[], Session] = SessionLocal,
        *,
        storage_service: StorageService,
        translator_factory: Callable[[], TranslatorService],
        sse_manager: SSEManager | None = None,
        poll_interval: float = 0.5,
    ) -> None:
        self._session_factory = session_factory
        self._storage = storage_service
        self._translator_factory = translator_factory
        self._sse = sse_manager or SSEManager()
        self._poll_interval = poll_interval
        self._worker_task: asyncio.Task | None = None
        self._worker_lock = asyncio.Lock()
        self._executor = ThreadPoolExecutor(max_workers=settings.THREAD_POOL_MAX_WORKERS)

    async def create_job(
        self,
        files: Sequence[UploadFile],
        *,
        masks: Sequence[UploadFile] | None,
        params: TranslateParams,
    ) -> JobCreateResult:
        if not files:
            raise ValidationError("请至少上传一张图片")
        if len(files) > settings.BATCH_MAX_IMAGES:
            raise ValidationError(f"最多同时上传 {settings.BATCH_MAX_IMAGES} 张图片")

        mask_list: List[UploadFile] = list(masks or [])
        if mask_list and len(mask_list) != len(files):
            raise ValidationError("Mask 数量需要与图片数量一致")

        job_id = str(uuid.uuid4())
        session = self._session_factory()
        try:
            job = Job(id=job_id, status=JobStatus.PENDING, images_count=len(files))
            session.add(job)
            session.flush()

            for index, file in enumerate(files):
                content = await file.read()
                is_valid, message = validate_image(content, file.content_type or "")
                if not is_valid:
                    raise ValidationError(message)

                image_uuid = str(uuid.uuid4())
                original_path = self._storage.save_original(job_id, image_uuid, content, filename=file.filename)

                mask_path = None
                if mask_list:
                    mask_file = mask_list[index]
                    if mask_file:
                        mask_bytes = await mask_file.read()
                        if mask_bytes:
                            mask_path = self._storage.save_mask(
                                job_id,
                                image_uuid,
                                mask_bytes,
                                mask_file.content_type or "image/png",
                            )

                translation = Translation(
                    job_id=job_id,
                    image_uuid=image_uuid,
                    order_index=index,
                    original_path=original_path,
                    mask_path=mask_path,
                    source_lang=params.source_lang,
                    target_lang=params.target_lang,
                    field=params.field,
                    enable_postprocess=params.enable_postprocess,
                    protect_product=params.protect_product,
                    status=TranslationStatus.PENDING,
                )
                session.add(translation)

            session.commit()
        except Exception:
            session.rollback()
            self._storage.delete_job_files(job_id)
            raise
        finally:
            session.close()

        await self._ensure_worker()
        return JobCreateResult(job_id=job_id, status=JobStatus.PENDING, images_count=len(files))

    def job_exists(self, job_id: str) -> bool:
        with self._session_factory() as session:
            return session.query(Job.id).filter(Job.id == job_id).first() is not None

    async def _ensure_worker(self) -> None:
        if self._worker_task and not self._worker_task.done():
            return
        async with self._worker_lock:
            if self._worker_task and not self._worker_task.done():
                return
            logger.info("Starting background translation worker")
            loop = asyncio.get_running_loop()
            self._worker_task = loop.create_task(self._worker_loop())

    async def _worker_loop(self) -> None:
        logger.info("Worker loop started")
        while True:
            try:
                translation = await asyncio.to_thread(self._pull_pending_translation)
            except Exception as exc:  # pragma: no cover - defensive logging
                logger.exception("Failed to pull pending translation: %s", exc)
                await asyncio.sleep(self._poll_interval)
                continue

            if translation is None:
                await asyncio.sleep(self._poll_interval)
                continue

            logger.info("Processing translation: %s", translation.id)
            try:
                await self._process_translation(translation)
                logger.info("Translation completed: %s", translation.id)
            except Exception as exc:  # pragma: no cover - defensive logging
                logger.exception("Translation worker error: job=%s translation=%s", translation.job_id, translation.id)
                await asyncio.sleep(self._poll_interval)

    def _pull_pending_translation(self) -> Translation | None:
        session = self._session_factory()
        try:
            with session.begin():
                result = session.execute(
                    text(
                        """
                        UPDATE translations
                        SET status = :processing,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = (
                            SELECT id FROM translations
                            WHERE status = :pending
                            ORDER BY created_at ASC
                            LIMIT 1
                        )
                        RETURNING id
                        """
                    ),
                    {
                        "processing": TranslationStatus.PROCESSING.name,
                        "pending": TranslationStatus.PENDING.name,
                    },
                ).mappings().first()

                if not result:
                    return None

                translation = session.get(Translation, result["id"])
                if translation is None:
                    return None
                session.expunge(translation)

            self._mark_job_processing(translation.job_id)
            return translation
        finally:
            session.close()

    async def _process_translation(self, translation: Translation) -> None:
        await self._sse.publish(
            translation.job_id,
            SSEEvent(
                event="progress",
                data={"image_uuid": translation.image_uuid, "index": translation.order_index, "status": "processing"},
            ),
        )

        try:
            original_bytes = await asyncio.to_thread(self._storage.get_file, translation.original_path)
            translator = self._translator_factory()
            loop = asyncio.get_running_loop()
            result_bytes = await loop.run_in_executor(
                self._executor,
                lambda: translator.translate(
                    original_bytes,
                    translation.source_lang,
                    translation.target_lang,
                    translation.field,
                    translation.enable_postprocess,
                    protect_product=translation.protect_product,
                ),
            )
            result_path = await asyncio.to_thread(
                self._storage.save_result,
                translation.job_id,
                translation.image_uuid,
                result_bytes,
            )
            await asyncio.to_thread(self._mark_translation_done, translation.id, result_path)
            await self._sse.publish(
                translation.job_id,
                SSEEvent(
                    event="progress",
                    data={
                        "image_uuid": translation.image_uuid,
                        "index": translation.order_index,
                        "status": "done",
                        "result_path": self._storage.to_public_path(result_path),
                    },
                ),
            )
        except Exception as exc:  # pragma: no cover - translator/storage failure
            await asyncio.to_thread(self._mark_translation_failed, translation.id, str(exc))
            await self._sse.publish(
                translation.job_id,
                SSEEvent(
                    event="error",
                    data={
                        "image_uuid": translation.image_uuid,
                        "index": translation.order_index,
                        "error": str(exc),
                    },
                ),
            )
        finally:
            await self._maybe_emit_completion(translation.job_id)

    def _mark_translation_done(self, translation_id: str, result_path: str) -> None:
        with self._session_factory() as session:
            db_translation = session.get(Translation, translation_id)
            if not db_translation:
                return
            db_translation.result_path = result_path
            db_translation.status = TranslationStatus.DONE
            db_translation.error_message = None
            db_translation.updated_at = datetime.utcnow()
            session.commit()

    def _mark_translation_failed(self, translation_id: str, message: str) -> None:
        with self._session_factory() as session:
            db_translation = session.get(Translation, translation_id)
            if not db_translation:
                return
            db_translation.status = TranslationStatus.FAILED
            db_translation.error_message = message[:500]
            db_translation.updated_at = datetime.utcnow()
            session.commit()

    def _mark_job_processing(self, job_id: str) -> None:
        with self._session_factory() as session:
            job = session.get(Job, job_id)
            if not job:
                return
            job.mark_processing()
            job.updated_at = datetime.utcnow()
            session.commit()

    async def _maybe_emit_completion(self, job_id: str) -> None:
        completed, failed, remaining = await asyncio.to_thread(self._update_job_progress, job_id)
        if remaining == 0:
            await self._sse.publish(
                job_id,
                SSEEvent(
                    event="complete",
                    data={"job_id": job_id, "completed": completed, "failed": failed},
                ),
            )

    def _update_job_progress(self, job_id: str) -> tuple[int, int, int]:
        with self._session_factory() as session:
            job = session.get(Job, job_id)
            if not job:
                return 0, 0, 0

            total = job.images_count
            completed = (
                session.query(Translation)
                .filter(Translation.job_id == job_id, Translation.status == TranslationStatus.DONE)
                .count()
            )
            failed = (
                session.query(Translation)
                .filter(Translation.job_id == job_id, Translation.status == TranslationStatus.FAILED)
                .count()
            )
            job.completed_count = completed
            job.failed_count = failed

            remaining = total - completed - failed
            if remaining <= 0:
                job.status = JobStatus.DONE if failed == 0 else JobStatus.FAILED
            else:
                job.status = JobStatus.PROCESSING
            job.updated_at = datetime.utcnow()
            session.commit()

            return completed, failed, remaining

    def shutdown(self) -> None:
        if self._worker_task:
            self._worker_task.cancel()
        self._executor.shutdown(wait=False)


__all__ = ["JobQueueService", "JobCreateResult"]

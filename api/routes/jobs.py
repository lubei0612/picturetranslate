"""Batch jobs API endpoints."""

from __future__ import annotations

import asyncio
import json

from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sse_starlette.sse import EventSourceResponse
from starlette.status import HTTP_201_CREATED

from api.dependencies import get_job_queue_service
from core.config import settings
from core.exceptions import NotFoundError
from services.job_queue import JobQueueService
from services.sse_manager import sse_manager
from services.translator import TranslateParams


router = APIRouter(tags=["jobs"])


@router.post("/jobs", status_code=HTTP_201_CREATED)
async def create_job_endpoint(
    files: List[UploadFile] = File(..., description="1-5 张图片"),
    masks: Optional[List[UploadFile]] = File(default=None, description="可选 Mask 文件"),
    source_lang: str = Form(settings.DEFAULT_SOURCE_LANG),
    target_lang: str = Form(settings.DEFAULT_TARGET_LANG),
    field: str = Form("e-commerce"),
    enable_postprocess: bool = Form(True),
    protect_product: bool = Form(settings.PROTECT_PRODUCT_DEFAULT),
    job_queue: JobQueueService = Depends(get_job_queue_service),
):
    params = TranslateParams(
        source_lang=source_lang,
        target_lang=target_lang,
        field=field,
        enable_postprocess=enable_postprocess,
        protect_product=protect_product,
    )
    result = await job_queue.create_job(files, masks=masks or [], params=params)
    return {
        "job_id": result.job_id,
        "images_count": result.images_count,
        "status": result.status.value,
        "sse_url": f"/api/jobs/{result.job_id}/sse",
    }


@router.get("/jobs/{job_id}/sse")
async def stream_job_events(job_id: str, job_queue: JobQueueService = Depends(get_job_queue_service)):
    exists = await asyncio.to_thread(job_queue.job_exists, job_id)
    if not exists:
        raise NotFoundError("任务不存在")

    async def event_generator():
        queue = await sse_manager.subscribe(job_id)
        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30)
                except asyncio.TimeoutError:
                    yield {"event": "ping", "data": "{}"}
                    continue

                payload = json.dumps(event.data, ensure_ascii=False)
                yield {"event": event.event, "data": payload}

                if event.event == "complete":
                    break
        finally:
            await sse_manager.unsubscribe(job_id, queue)

    return EventSourceResponse(event_generator())


__all__ = ["router", "create_job_endpoint", "stream_job_events"]

"""History endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from api.dependencies import get_history_service, get_storage_service
from services.history import HistoryService
from services.storage import StorageService


router = APIRouter(tags=["history"])


@router.get("/history")
async def list_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    source_lang: Optional[str] = Query(None),
    target_lang: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    history_service: HistoryService = Depends(get_history_service),
    storage: StorageService = Depends(get_storage_service),
):
    items, total = history_service.list_history(
        page=page,
        limit=limit,
        source_lang=source_lang,
        target_lang=target_lang,
        date_from=date_from,
        date_to=date_to,
    )
    pages = (total + limit - 1) // limit if total else 0
    return {
        "items": [_serialize_translation(item, storage) for item in items],
        "total": total,
        "page": page,
        "pages": pages,
    }


@router.get("/history/{translation_id}")
async def get_history_item(
    translation_id: str,
    history_service: HistoryService = Depends(get_history_service),
    storage: StorageService = Depends(get_storage_service),
):
    translation = history_service.get_translation(translation_id)
    return _serialize_translation(translation, storage)


@router.delete("/history/{translation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_history_item(
    translation_id: str,
    history_service: HistoryService = Depends(get_history_service),
):
    history_service.delete_translation(translation_id)
    return None


def _serialize_translation(translation, storage: StorageService) -> dict:
    def _url(path: Optional[str]):
        return storage.to_public_path(path) if path else None

    return {
        "id": translation.id,
        "job_id": translation.job_id,
        "image_uuid": translation.image_uuid,
        "source_lang": translation.source_lang,
        "target_lang": translation.target_lang,
        "field": translation.field,
        "status": translation.status.value,
        "created_at": translation.created_at.isoformat() if translation.created_at else None,
        "original_path": translation.original_path,
        "mask_path": translation.mask_path,
        "result_path": translation.result_path,
        "original_url": _url(translation.original_path),
        "mask_url": _url(translation.mask_path),
        "result_url": _url(translation.result_path),
    }


__all__ = ["router", "list_history", "get_history_item", "delete_history_item"]

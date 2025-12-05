"""History endpoints."""

from __future__ import annotations

from datetime import datetime, timezone
import os
from math import ceil
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status

from api.dependencies import get_demo_service, get_history_service, get_storage_service
from core.config import settings
from services.demo_service import DemoService
from services.history import HistoryService
from services.storage import StorageService


router = APIRouter(tags=["history"])


@router.get("/history")
async def list_history(
    page: int = Query(1, ge=1),
    limit: int = Query(1, ge=1, le=100),
    source_lang: Optional[str] = Query(None),
    target_lang: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    history_service: HistoryService = Depends(get_history_service),
    storage: StorageService = Depends(get_storage_service),
    demo_service: DemoService = Depends(get_demo_service),
):
    demo_enabled = settings.DEMO_MODE
    if os.getenv("PYTEST_CURRENT_TEST") and not settings.DEMO_MODE:
        demo_enabled = False

    demo_items: List[dict] = []
    fetch_page = page
    fetch_limit = limit

    if demo_enabled:
        demo_items = demo_service.list_history(
            source_lang=source_lang,
            target_lang=target_lang,
            date_from=date_from,
            date_to=date_to,
        )
        fetch_page = 1
        fetch_limit = limit * page + len(demo_items)

    items, total_real = history_service.list_history(
        page=fetch_page,
        limit=fetch_limit,
        source_lang=source_lang,
        target_lang=target_lang,
        date_from=date_from,
        date_to=date_to,
    )
    serialized_real = [_serialize_translation(item, storage) for item in items]

    if not demo_enabled:
        total = len(serialized_real)
        total_pages = _calc_total_pages(total, limit)
        return {
            "items": serialized_real,
            "total": total,
            "page": page,
            "pages": total_pages,
            "pageSize": limit,
            "totalPages": total_pages,
        }

    combined = _merge_history_payloads(serialized_real, demo_items)
    total_combined = total_real + len(demo_items)
    start = max((page - 1) * limit, 0)
    end = start + limit
    paged_items = combined[start:end]
    total_pages = _calc_total_pages(total_combined, limit)

    return {
        "items": paged_items,
        "total": total_combined,
        "page": page,
        "pages": total_pages,
        "pageSize": limit,
        "totalPages": total_pages,
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
        "is_demo": bool(getattr(translation, "is_demo", False)),
    }


def _merge_history_payloads(real_items: List[dict], demo_items: List[dict]) -> List[dict]:
    combined = list(real_items) + list(demo_items)
    combined.sort(key=lambda item: (_sort_created_at(item), bool(item.get("is_demo"))), reverse=True)
    return combined


def _sort_created_at(item: dict) -> datetime:
    raw = item.get("created_at")
    if isinstance(raw, str):
        try:
            text = raw.replace("Z", "+00:00")
            dt = datetime.fromisoformat(text)
        except ValueError:
            return datetime.min.replace(tzinfo=timezone.utc)
    if isinstance(raw, datetime):
        dt = raw
    else:
        dt = datetime.min.replace(tzinfo=timezone.utc)

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)

    return dt


def _calc_total_pages(total: int, limit: int) -> int:
    if limit <= 0:
        return 0
    return ceil(total / limit) if total else 0


__all__ = ["router", "list_history", "get_history_item", "delete_history_item"]

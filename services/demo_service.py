"""Demo data helpers for hybrid demo/real responses."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from models.translation import TranslationStatus


UTC = timezone.utc


@dataclass(frozen=True)
class DemoHistoryItem:
    """Serializable demo entry for history API responses."""

    id: str
    job_id: str
    image_uuid: str
    source_lang: str
    target_lang: str
    field: str
    status: TranslationStatus
    created_at: datetime
    original_url: str
    result_url: str
    mask_url: Optional[str] = None

    def to_payload(self) -> dict:
        return {
            "id": self.id,
            "job_id": self.job_id,
            "image_uuid": self.image_uuid,
            "source_lang": self.source_lang,
            "target_lang": self.target_lang,
            "field": self.field,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "original_path": None,
            "mask_path": None,
            "result_path": None,
            "original_url": self.original_url,
            "mask_url": self.mask_url,
            "result_url": self.result_url,
            "is_demo": True,
        }


class DemoService:
    """Provides curated demo responses for API consumers."""

    def __init__(self, history_items: Optional[List[DemoHistoryItem]] = None) -> None:
        self._history_items = history_items or _default_history_items()

    def list_history(
        self,
        *,
        source_lang: Optional[str] = None,
        target_lang: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> List[dict]:
        items = []
        for item in self._history_items:
            if source_lang and item.source_lang != source_lang:
                continue
            if target_lang and item.target_lang != target_lang:
                continue
            if date_from and item.created_at < date_from:
                continue
            if date_to and item.created_at > date_to:
                continue
            items.append(item)

        return [entry.to_payload() for entry in sorted(items, key=lambda x: x.created_at, reverse=True)]

    def history_count(self, **filters) -> int:
        return len(self.list_history(**filters))


def _default_history_items() -> List[DemoHistoryItem]:
    now = datetime.now(tz=UTC)
    return [
        DemoHistoryItem(
            id="__demo_history_1",
            job_id="__demo_job_1",
            image_uuid="__demo_image_1",
            source_lang="zh-CN",
            target_lang="en",
            field="e-commerce",
            status=TranslationStatus.DONE,
            created_at=now - timedelta(hours=1),
            original_url="https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=600&q=80",
            result_url="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
        ),
        DemoHistoryItem(
            id="__demo_history_2",
            job_id="__demo_job_2",
            image_uuid="__demo_image_2",
            source_lang="zh-CN",
            target_lang="ja",
            field="fashion",
            status=TranslationStatus.PROCESSING,
            created_at=now - timedelta(hours=3, minutes=20),
            original_url="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80",
            result_url="https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=600&q=80",
        ),
        DemoHistoryItem(
            id="__demo_history_3",
            job_id="__demo_job_3",
            image_uuid="__demo_image_3",
            source_lang="en",
            target_lang="de",
            field="electronics",
            status=TranslationStatus.FAILED,
            created_at=now - timedelta(days=1, hours=2),
            original_url="https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80",
            result_url="https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=600&q=80",
        ),
        DemoHistoryItem(
            id="__demo_history_4",
            job_id="__demo_job_4",
            image_uuid="__demo_image_4",
            source_lang="ko",
            target_lang="zh-CN",
            field="beauty",
            status=TranslationStatus.DONE,
            created_at=now - timedelta(days=2),
            original_url="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
            result_url="https://images.unsplash.com/photo-1523381140794-cc16d85ee5f9?auto=format&fit=crop&w=600&q=80",
        ),
        DemoHistoryItem(
            id="__demo_history_5",
            job_id="__demo_job_5",
            image_uuid="__demo_image_5",
            source_lang="ja",
            target_lang="en",
            field="home",
            status=TranslationStatus.DONE,
            created_at=now - timedelta(days=4, hours=6),
            original_url="https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=600&q=80",
            result_url="https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=600&q=80",
        ),
    ]


__all__ = ["DemoService", "DemoHistoryItem"]

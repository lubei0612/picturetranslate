"""Service layer for TextLayer CRUD operations."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any, Dict, Iterable, List

from sqlalchemy import and_
from sqlalchemy.orm import Session

from core.database import SessionLocal
from core.exceptions import NotFoundError, VersionConflictError
from models import TextLayer


class LayerService:
    """Manages TextLayer persistence with optimistic concurrency control."""

    def __init__(self, session_factory: Callable[[], Session] = SessionLocal) -> None:
        self._session_factory = session_factory

    def list_layers(self, translation_id: str) -> List[TextLayer]:
        with self._session_factory() as session:
            layers = (
                session.query(TextLayer)
                .filter(TextLayer.translation_id == translation_id)
                .order_by(TextLayer.created_at.asc())
                .all()
            )
            for layer in layers:
                session.expunge(layer)
            return layers

    def create_layer(
        self,
        *,
        translation_id: str,
        bbox: list[float],
        original_text: str,
        translated_text: str,
        style: dict[str, Any],
    ) -> TextLayer:
        with self._session_factory() as session:
            layer = TextLayer(
                translation_id=translation_id,
                bbox=bbox,
                original_text=original_text,
                translated_text=translated_text,
                style=style,
            )
            session.add(layer)
            session.commit()
            session.refresh(layer)
            session.expunge(layer)
            return layer

    def update_layer(
        self,
        layer_id: str,
        *,
        translated_text: str | None,
        style_updates: dict[str, Any] | None,
        version: int,
    ) -> TextLayer:
        with self._session_factory() as session:
            layer = session.get(TextLayer, layer_id)
            if not layer:
                raise NotFoundError("图层不存在")

            self._ensure_version(layer, version)

            if translated_text is not None:
                layer.translated_text = translated_text
            if style_updates:
                layer.style = self._merge_style(layer.style or {}, style_updates)

            layer.increment_version()
            session.commit()
            session.refresh(layer)
            session.expunge(layer)
            return layer

    def delete_layer(self, layer_id: str) -> None:
        with self._session_factory() as session:
            layer = session.get(TextLayer, layer_id)
            if not layer:
                raise NotFoundError("图层不存在")
            session.delete(layer)
            session.commit()

    def batch_update(
        self,
        translation_id: str,
        updates: Iterable[dict[str, Any]],
    ) -> List[TextLayer]:
        payload = list(updates)
        if not payload:
            return []

        layer_ids = [item["id"] for item in payload]
        session = self._session_factory()
        try:
            db_layers = (
                session.query(TextLayer)
                .filter(and_(TextLayer.translation_id == translation_id, TextLayer.id.in_(layer_ids)))
                .all()
            )
            layer_map = {layer.id: layer for layer in db_layers}

            if len(layer_map) != len(layer_ids):
                missing = set(layer_ids) - set(layer_map.keys())
                raise NotFoundError(f"找不到图层: {', '.join(missing)}")

            updated: List[TextLayer] = []
            for item in payload:
                layer = layer_map[item["id"]]
                self._ensure_version(layer, item["version"])

                if item.get("translated_text") is not None:
                    layer.translated_text = item["translated_text"]
                if item.get("style"):
                    layer.style = self._merge_style(layer.style or {}, item["style"])

                layer.increment_version()
                updated.append(layer)

            session.commit()
            for layer in updated:
                session.refresh(layer)
                session.expunge(layer)
            return updated
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def _ensure_version(self, layer: TextLayer, incoming_version: int) -> None:
        if layer.version != incoming_version:
            raise VersionConflictError(
                "图层已被其它会话修改",
                details={"latest": self._serialize_layer(layer)},
            )

    @staticmethod
    def _merge_style(current: Dict[str, Any], updates: Dict[str, Any]) -> Dict[str, Any]:
        merged = current.copy()
        for key, value in updates.items():
            if value is not None:
                merged[key] = value
        return merged

    @staticmethod
    def _serialize_layer(layer: TextLayer) -> dict[str, Any]:
        return {
            "id": layer.id,
            "translationId": layer.translation_id,
            "bbox": layer.bbox,
            "originalText": layer.original_text,
            "translatedText": layer.translated_text,
            "style": layer.style,
            "version": layer.version,
            "updatedAt": layer.updated_at.isoformat() if layer.updated_at else None,
        }


__all__ = ["LayerService"]

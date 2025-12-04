"""Text layer CRUD endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from api.dependencies import get_layer_service
from api.schemas import (
    DEFAULT_LAYER_STYLE,
    LayerStyle,
    TextLayerBatchUpdateRequest,
    TextLayerResponse,
    TextLayerUpdate,
)
from models import TextLayer
from services.layer_service import LayerService


router = APIRouter(tags=["layers"])


def _serialize_layer(layer: TextLayer) -> TextLayerResponse:
    style_payload = layer.style or DEFAULT_LAYER_STYLE.model_dump(by_alias=True)
    style_model = LayerStyle.model_validate(style_payload)
    return TextLayerResponse(
        id=layer.id,
        translation_id=layer.translation_id,
        bbox=tuple(layer.bbox or (0.0, 0.0, 0.0, 0.0)),
        original_text=layer.original_text,
        translated_text=layer.translated_text,
        style=style_model,
        version=layer.version,
    )


@router.get("/translations/{translation_id}/layers", response_model=list[TextLayerResponse])
def list_layers(translation_id: str, service: LayerService = Depends(get_layer_service)) -> list[TextLayerResponse]:
    layers = service.list_layers(translation_id)
    return [_serialize_layer(layer) for layer in layers]


@router.patch("/layers/{layer_id}", response_model=TextLayerResponse)
def update_layer(
    layer_id: str,
    payload: TextLayerUpdate,
    service: LayerService = Depends(get_layer_service),
) -> TextLayerResponse:
    style_updates = (
        payload.style.model_dump(exclude_none=True, by_alias=True) if payload.style else None
    )
    layer = service.update_layer(
        layer_id,
        translated_text=payload.translated_text,
        style_updates=style_updates,
        version=payload.version,
    )
    return _serialize_layer(layer)


@router.post("/layers/batch", response_model=list[TextLayerResponse])
def batch_update_layers(
    payload: TextLayerBatchUpdateRequest,
    service: LayerService = Depends(get_layer_service),
) -> list[TextLayerResponse]:
    updates = []
    for item in payload.layers:
        update = {
            "id": item.id,
            "version": item.version,
        }
        if item.translated_text is not None:
            update["translated_text"] = item.translated_text
        if item.style is not None:
            update["style"] = item.style.model_dump(exclude_none=True, by_alias=True)
        updates.append(update)

    layers = service.batch_update(payload.translation_id, updates)
    return [_serialize_layer(layer) for layer in layers]


__all__ = ["router", "list_layers", "update_layer", "batch_update_layers"]

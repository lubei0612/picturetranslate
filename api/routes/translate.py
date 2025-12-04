"""Translation endpoint."""

from __future__ import annotations

import asyncio
from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import Response

from api.dependencies import get_cache_service, get_translator_service
from core.config import settings
from core.exceptions import ValidationError
from services.cache import CacheService
from services.translator import TranslatorService
from utils.image import compute_hash, validate_image


router = APIRouter(tags=["translate"])
executor = ThreadPoolExecutor(max_workers=settings.THREAD_POOL_MAX_WORKERS)


@router.post("/translate", response_class=Response)
async def translate_image(
    file: UploadFile = File(...),
    source_lang: str = Form(settings.DEFAULT_SOURCE_LANG),
    target_lang: str = Form(settings.DEFAULT_TARGET_LANG),
    field: str = Form("e-commerce"),
    enable_postprocess: bool = Form(True),
    protect_product: bool = Form(settings.PROTECT_PRODUCT_DEFAULT),
    translator: TranslatorService = Depends(get_translator_service),
    cache: CacheService = Depends(get_cache_service),
):
    """Translate an uploaded image and return a PNG."""

    content = await file.read()
    content_type = file.content_type or ""

    is_valid, message = validate_image(content, content_type)
    if not is_valid:
        raise ValidationError(message)

    cache_key = compute_hash(
        content, source_lang, target_lang, field, protect_product=protect_product
    )
    cached = cache.get(cache_key)
    if cached:
        return Response(content=cached, media_type="image/png")

    loop = asyncio.get_running_loop()
    result: bytes = await loop.run_in_executor(
        executor,
        lambda: translator.translate(
            content,
            source_lang,
            target_lang,
            field,
            enable_postprocess,
            protect_product=protect_product,
        ),
    )

    cache.set(cache_key, result)
    return Response(content=result, media_type="image/png")


__all__ = ["router", "translate_image"]

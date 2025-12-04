"""Image validation and hashing helpers."""

from __future__ import annotations

import hashlib
from io import BytesIO
from typing import Tuple

from PIL import Image

from core.config import settings

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


def validate_image(content: bytes, content_type: str) -> Tuple[bool, str]:
    """Validate MIME type, size, and dimensions."""

    if content_type not in ALLOWED_TYPES:
        return False, "仅支持 JPG、PNG、WebP 格式"

    if len(content) > settings.MAX_FILE_SIZE:
        size_mb = len(content) / 1024 / 1024
        return False, f"图片过大 ({size_mb:.1f}MB)，最大支持 10MB"

    try:
        image = Image.open(BytesIO(content))
        width, height = image.size
    except Exception as exc:  # pragma: no cover - pillow already tested
        return False, f"无法解析图片: {exc}"

    if width > settings.MAX_DIMENSION or height > settings.MAX_DIMENSION:
        return False, f"图片尺寸过大 ({width}x{height})，最大支持 8192x8192"

    aspect_ratio = max(width / max(height, 1), height / max(width, 1))
    if aspect_ratio > 10:
        return False, "图片宽高比超过 10:1"

    return True, ""


def compute_hash(content: bytes, source: str, target: str, field: str) -> str:
    """Compute cache key using md5 hash + translation parameters."""

    digest = hashlib.md5(content).hexdigest()
    return f"{digest}:{source}:{target}:{field}"


__all__ = ["validate_image", "compute_hash"]

"""Image validation and hashing helpers."""

from __future__ import annotations

import hashlib
from io import BytesIO
from typing import NamedTuple, Optional

from PIL import Image, UnidentifiedImageError

from core.config import settings

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MIME_SYNONYMS = {"image/jpg": "image/jpeg"}
ASPECT_RATIO_LIMIT = 10.0


class ValidationResult(NamedTuple):
    """Structured representation of an image validation outcome."""

    is_valid: bool
    message: str


def _normalize_content_type(content_type: Optional[str]) -> Optional[str]:
    if not content_type:
        return None
    lowered = content_type.lower().strip()
    return MIME_SYNONYMS.get(lowered, lowered)


def _detect_content_type(content: bytes) -> Optional[str]:
    try:
        with Image.open(BytesIO(content)) as img:
            return Image.MIME.get(img.format)
    except UnidentifiedImageError:
        return None


def validate_image(content: bytes, content_type: Optional[str]) -> ValidationResult:
    """Validate MIME type, size, and dimensions for uploaded images."""

    normalized_type = _normalize_content_type(content_type)
    detected_type = normalized_type or _detect_content_type(content)
    if detected_type not in ALLOWED_MIME_TYPES:
        return ValidationResult(False, "仅支持 JPG、PNG、WebP 格式")

    if len(content) > settings.MAX_FILE_SIZE:
        size_mb = len(content) / 1024 / 1024
        return ValidationResult(False, f"图片过大 ({size_mb:.1f}MB)，最大支持 10MB")

    try:
        with Image.open(BytesIO(content)) as image:
            image.load()
            width, height = image.size
    except UnidentifiedImageError as exc:  # pragma: no cover - depends on Pillow
        return ValidationResult(False, f"无法解析图片: {exc}")

    if width > settings.MAX_DIMENSION or height > settings.MAX_DIMENSION:
        return ValidationResult(False, f"图片尺寸过大 ({width}x{height})，最大支持 8192x8192")

    aspect_ratio = max(width / max(height, 1), height / max(width, 1))
    if aspect_ratio > ASPECT_RATIO_LIMIT:
        return ValidationResult(False, "图片宽高比超过 10:1")

    return ValidationResult(True, "")


def hash_bytes(data: bytes) -> str:
    """Return a stable hex digest for arbitrary binary data."""

    return hashlib.md5(data).hexdigest()


def compute_hash(
    content: bytes,
    source: str,
    target: str,
    field: str,
    *,
    protect_product: Optional[bool] = None,
    mask_digest: Optional[str] = None,
    extra: Optional[str] = None,
) -> str:
    """Compute a cache key using image hash plus translation parameters."""

    components = [
        hash_bytes(content),
        source.strip().lower(),
        target.strip().lower(),
        field.strip().lower(),
    ]

    if protect_product is not None:
        components.append(f"protect={int(protect_product)}")
    if mask_digest:
        components.append(f"mask={mask_digest}")
    if extra:
        components.append(extra)

    return "|".join(components)


def compute_mask_digest(mask_bytes: Optional[bytes]) -> Optional[str]:
    """Return a digest for mask bytes if provided."""

    if not mask_bytes:
        return None
    return hash_bytes(mask_bytes)


__all__ = [
    "ValidationResult",
    "validate_image",
    "hash_bytes",
    "compute_hash",
    "compute_mask_digest",
]

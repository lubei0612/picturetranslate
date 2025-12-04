from __future__ import annotations

from io import BytesIO

from PIL import Image

from utils.image import compute_hash, validate_image


def _create_image_bytes(format: str = "PNG") -> bytes:
    image = Image.new("RGB", (100, 100), color="red")
    buffer = BytesIO()
    image.save(buffer, format=format)
    return buffer.getvalue()


def test_validate_image_success():
    content = _create_image_bytes()
    is_valid, message = validate_image(content, "image/png")

    assert is_valid is True
    assert message == ""


def test_validate_image_invalid_type():
    content = _create_image_bytes()
    is_valid, message = validate_image(content, "image/gif")

    assert is_valid is False
    assert "仅支持" in message


def test_compute_hash_changes_with_parameters():
    content = _create_image_bytes()
    hash_a = compute_hash(content, "auto", "zh", "e-commerce")
    hash_b = compute_hash(content, "auto", "en", "e-commerce")

    assert hash_a != hash_b

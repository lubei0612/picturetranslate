"""File storage helpers for job assets."""

from __future__ import annotations

import io
import shutil
from pathlib import Path
from typing import Optional

from PIL import Image

from core.config import settings

ALLOWED_MASK_MIME = {"image/png", "image/webp"}


class StorageService:
    """Persist original, mask, and result files on disk."""

    def __init__(self, base_path: Path | str | None = None) -> None:
        self.base_path = Path(base_path or settings.STORAGE_DIR).resolve()
        self.base_path.mkdir(parents=True, exist_ok=True)

    def save_original(self, job_id: str, image_uuid: str, content: bytes, *, filename: str | None = None) -> str:
        ext = self._infer_extension(filename)
        path = self._image_dir(job_id, image_uuid) / f"original{ext}"
        path.write_bytes(content)
        return self._relative(path)

    def save_mask(self, job_id: str, image_uuid: str, content: bytes, mime_type: str | None) -> str:
        data = content
        ext = "png"
        if mime_type and mime_type.lower() in ALLOWED_MASK_MIME:
            ext = "webp" if mime_type.lower() == "image/webp" else "png"
        else:
            # Convert unsupported masks to PNG for compatibility.
            image = Image.open(io.BytesIO(content))
            buffer = io.BytesIO()
            image.save(buffer, format="PNG")
            data = buffer.getvalue()
            ext = "png"

        path = self._image_dir(job_id, image_uuid) / f"mask.{ext}"
        path.write_bytes(data)
        return self._relative(path)

    def save_result(self, job_id: str, image_uuid: str, content: bytes) -> str:
        path = self._image_dir(job_id, image_uuid) / "result.png"
        path.write_bytes(content)
        return self._relative(path)

    def get_file(self, relative_path: str) -> bytes:
        path = self.base_path / relative_path
        return path.read_bytes()

    def delete_job_files(self, job_id: str) -> None:
        target = self.base_path / job_id
        if target.exists():
            shutil.rmtree(target)

    def delete_image_files(self, job_id: str, image_uuid: str) -> None:
        target = self.base_path / job_id / image_uuid
        if target.exists():
            shutil.rmtree(target)
        # Remove job directory if empty to avoid clutter.
        job_dir = self.base_path / job_id
        if job_dir.exists() and not any(job_dir.iterdir()):
            job_dir.rmdir()

    def to_public_path(self, relative_path: str) -> str:
        return f"/storage/{relative_path}".replace("//", "/")

    def _image_dir(self, job_id: str, image_uuid: str) -> Path:
        path = self.base_path / job_id / image_uuid
        path.mkdir(parents=True, exist_ok=True)
        return path

    @staticmethod
    def _infer_extension(filename: Optional[str]) -> str:
        if not filename or "." not in filename:
            return ".png"
        ext = filename.rsplit(".", 1)[-1].lower()
        if ext not in {"png", "jpg", "jpeg", "webp"}:
            return ".png"
        if ext == "jpg":
            ext = "jpeg"
        return f".{ext}"


__all__ = ["StorageService"]

"""Global configuration powered by pydantic-settings."""

from __future__ import annotations

from pathlib import Path
from typing import List, Literal, Optional

from pydantic import computed_field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-driven application configuration."""

    # Environment & monitoring
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = False
    DEMO_MODE: bool = False
    SENTRY_DSN: Optional[str] = None

    # Aliyun credentials
    ALI_ACCESS_KEY_ID: str
    ALI_ACCESS_KEY_SECRET: str
    ALI_REGION: str = "cn-hangzhou"

    # Translation defaults
    DEFAULT_SOURCE_LANG: str = "en"
    DEFAULT_TARGET_LANG: str = "zh"
    PROTECT_PRODUCT_DEFAULT: bool = True
    BATCH_MAX_IMAGES: int = 5

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:4173",
        "http://localhost:5173",
        "http://localhost:5174",
        "https://app.farmaxbeauty.shop",
    ]

    # File constraints
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    MAX_DIMENSION: int = 8192

    # Cache & retry
    CACHE_MAX_SIZE: int = 100
    CACHE_TTL: int = 60 * 60  # 1 hour
    RETRY_MAX_ATTEMPTS: int = 3
    RETRY_DELAY: float = 1.0

    # Worker / queue limits
    THREAD_POOL_MAX_WORKERS: int = 6

    # Storage & database
    DATA_DIR: Path = Path("./data")
    STORAGE_DIR: Path = Path("./storage")
    BACKUP_DIR: Path = Path("./backups")
    DATABASE_FILENAME: str = "translations.db"

    # Cleanup / retention
    CLEANUP_RETENTION_DAYS: int = 90
    CLEANUP_CRON: str = "0 3 * * *"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _split_cors_origins(cls, value):
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("DATA_DIR", "STORAGE_DIR", "BACKUP_DIR", mode="before")
    @classmethod
    def _ensure_path(cls, value):
        if isinstance(value, str):
            return Path(value)
        return value

    @field_validator("BATCH_MAX_IMAGES", "THREAD_POOL_MAX_WORKERS", mode="before")
    @classmethod
    def _ensure_positive(cls, value):
        if isinstance(value, str):
            value = int(value)
        if value <= 0:
            raise ValueError("Value must be positive")
        return value

    def model_post_init(self, __context):  # type: ignore[override]
        for directory in (self.DATA_DIR, self.STORAGE_DIR, self.BACKUP_DIR):
            Path(directory).mkdir(parents=True, exist_ok=True)

    @computed_field(return_type=Path)
    def database_path(self) -> Path:
        return Path(self.DATA_DIR) / self.DATABASE_FILENAME

    @computed_field(return_type=str)
    def database_url(self) -> str:
        return f"sqlite:///{self.database_path}"


settings = Settings()


__all__ = ["settings", "Settings"]

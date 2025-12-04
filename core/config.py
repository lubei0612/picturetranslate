"""Global configuration powered by pydantic-settings."""

from __future__ import annotations

from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-driven application configuration."""

    # Aliyun credentials
    ALI_ACCESS_KEY_ID: str
    ALI_ACCESS_KEY_SECRET: str

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    # File constraints
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    MAX_DIMENSION: int = 8192

    # Cache
    CACHE_MAX_SIZE: int = 100
    CACHE_TTL: int = 60 * 60  # 1 hour

    # Retry strategy
    RETRY_MAX_ATTEMPTS: int = 3
    RETRY_DELAY: float = 1.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()


__all__ = ["settings", "Settings"]

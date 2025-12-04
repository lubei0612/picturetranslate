"""SQLite database engine and session management."""

from __future__ import annotations

from contextlib import contextmanager
from typing import Generator, Iterable, Type

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from core.config import settings


class Base(DeclarativeBase):
    """Declarative base for ORM models."""


engine: Engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False, "timeout": 30},
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
)


@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):  # pragma: no cover - sqlite specific
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA busy_timeout=30000")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.close()


SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, expire_on_commit=False)


@contextmanager
def get_session() -> Generator[Session, None, None]:
    session: Session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def init_db(models: Iterable[Type[DeclarativeBase]] | None = None) -> None:
    """Initialize database tables for provided models (or discover defaults)."""

    if models is None:
        # Lazy import to avoid circular references.
        from models import job, translation  # noqa: F401

    Base.metadata.create_all(bind=engine)


__all__ = ["Base", "engine", "SessionLocal", "get_session", "init_db"]

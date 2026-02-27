"""Async PostgreSQL connection pool and session management.

Security notes
--------------
* The connection string is read from ``settings.database_url`` which itself
  comes from the ``EXAM_GENIUS_DATABASE_URL`` environment variable — **no
  hardcoded credentials**.
* All queries go through SQLModel / SQLAlchemy's ORM layer, which uses
  parameterised statements → built-in SQL-injection protection.
* The pool size is tuned for 4 Uvicorn workers × moderate concurrency.
"""

from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from app.config import settings

logger = logging.getLogger(__name__)

# ── Engine (lazily created) ──────────────────────────────────────────────────
_engine = None


def _get_engine():
    """Return (and cache) the async engine, or ``None`` if no DB URL is set."""
    global _engine
    if _engine is not None:
        return _engine

    db_url = settings.database_url
    if not db_url:
        logger.warning("DATABASE_URL is empty — analytics logging disabled.")
        return None

    # Convert postgresql:// → postgresql+asyncpg:// if needed
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)

    _engine = create_async_engine(
        db_url,
        echo=False,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
    )
    return _engine


def _get_session_factory():
    """Return an async session factory bound to the current engine."""
    engine = _get_engine()
    if engine is None:
        return None
    return sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


# ── Public helpers ───────────────────────────────────────────────────────────


async def init_db() -> None:
    """Create all SQLModel tables if they don't exist yet.

    Called once at application startup via the FastAPI ``lifespan``.
    """
    engine = _get_engine()
    if engine is None:
        return

    # Import models so SQLModel.metadata knows about every table
    import app.models.analytics  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    logger.info("Analytics tables created / verified.")


async def get_session() -> AsyncSession | None:
    """Yield a short-lived async DB session (or ``None`` when DB is off)."""
    factory = _get_session_factory()
    if factory is None:
        return None
    async with factory() as session:
        return session


async def close_db() -> None:
    """Dispose of the connection pool (called on shutdown)."""
    global _engine
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        logger.info("Database connection pool closed.")

"""Haliç Exam Genius Pro — FastAPI application entry point."""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.config import ALLOWED_ORIGINS, settings
from app.database import close_db, init_db
from app.routes.exam import router as exam_router
from app.services.sync_service import run_sync_loop, warm_cache

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown hook — initialise DB, warm cache, run sync task."""
    await init_db()

    # Warm cache so first /api/courses request is instant
    await warm_cache()

    # Background sync: detect Excel changes and invalidate cache
    sync_task = asyncio.create_task(run_sync_loop())

    yield

    # Shutdown: cancel sync task
    sync_task.cancel()
    try:
        await sync_task
    except asyncio.CancelledError:
        pass

    await close_db()


app = FastAPI(
    title=settings.app_title,
    description="Backend API for Halic Exam Genius — exam schedule, calendar export, and more.",
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Compress response bodies to reduce payload size over slow networks.
app.add_middleware(GZipMiddleware, minimum_size=500)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(exam_router)


# ── Root / health ────────────────────────────────────────────────────────────


@app.get("/")
async def root():
    return {"message": "Halic Exam Genius API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

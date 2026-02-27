"""Haliç Exam Genius Pro — FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes.exam import router as exam_router

app = FastAPI(
    title=settings.app_title,
    description="Backend API for Halic Exam Genius — exam schedule, calendar export, and more.",
    version=settings.app_version,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(exam_router)


# ── Root / health ────────────────────────────────────────────────────────────


@app.get("/")
async def root():
    return {"message": "Halic Exam Genius API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

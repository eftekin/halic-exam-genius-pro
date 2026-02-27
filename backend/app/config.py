"""Application configuration and constants."""

from __future__ import annotations

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """App-wide settings, overridable via environment variables.

    Every field can be overridden with an env var prefixed ``EXAM_GENIUS_``.
    See ``.env.example`` for the full list of available variables.
    """

    app_title: str = "Halic Exam Genius API"
    app_version: str = "0.1.0"

    # ── Security ──────────────────────────────────────────────────────────
    # A random secret used for internal signing / auth tokens.
    # Generate with:  python -c "import secrets; print(secrets.token_urlsafe(64))"
    secret_key: str = "CHANGE-ME-IN-PRODUCTION"

    # ╔══════════════════════════════════════════════════════════════════╗
    # ║  UPDATE THIS URL EVERY SEMESTER                                ║
    # ║  Go to halic.edu.tr → announcements → find the new .xlsx link ║
    # ╚══════════════════════════════════════════════════════════════════╝
    exam_schedule_url: str = (
        "https://halic.edu.tr/wp-content/uploads/duyurular/2025/12/24/2025-2026-guz-final-tum-liste.xlsx"
    )

    # ── CORS ──────────────────────────────────────────────────────────────
    # In production set to your Vercel domain(s), comma-separated:
    #   EXAM_GENIUS_CORS_ORIGINS=https://exam-genius.vercel.app
    cors_origins: list[str] = ["http://localhost:3000"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _parse_cors(cls, v: str | list[str]) -> list[str]:
        """Accept a comma-separated string from .env and split into a list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # ── Database (PostgreSQL for analytics) ───────────────────────────────
    database_url: str = ""

    # Cache TTL for exam data (seconds). 0 = no auto-expiry.
    cache_ttl_seconds: int = 3600

    class Config:
        env_prefix = "EXAM_GENIUS_"


settings = Settings()

# ── Column-name constants (match the upstream Excel headers) ──────────────────
EXAM_DATE_COLUMN = "SINAV GÜNÜ"
EXAM_TIME_COLUMN = "BAŞLANGIÇ SAATİ"
EXAM_FINISH_TIME_COLUMN = "BİTİŞ SAATİ"
COURSE_CODE_COLUMN = "DERS KODU"
COURSE_NAME_COLUMN = "DERS ADI"
COURSE_CODE_AND_NAME_COLUMN = "DERS KODU VE ADI"
CLASSROOM_CODE_COLUMN = "DERSLİK/ODA KODLARI"
FACULTY_COLUMN = "FAKÜLTE/ENSTİTÜ/YÜKSEKOKUL ADI"
PROGRAM_COLUMN = "PROGRAM ADI"
STUDENT_COUNT_COLUMN = "ÖĞRENCİ SAYISI"

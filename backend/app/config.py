"""Application configuration and constants."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """App-wide settings, overridable via environment variables."""

    app_title: str = "Halic Exam Genius API"
    app_version: str = "0.1.0"

    # ╔══════════════════════════════════════════════════════════════════╗
    # ║  UPDATE THIS URL EVERY SEMESTER                                ║
    # ║  Go to halic.edu.tr → announcements → find the new .xlsx link ║
    # ╚══════════════════════════════════════════════════════════════════╝
    exam_schedule_url: str = (
        "https://halic.edu.tr/wp-content/uploads/duyurular/2025/12/24/"
        "2025-2026-guz-final-tum-liste.xlsx"
    )

    # CORS – restrict in production
    cors_origins: list[str] = ["*"]

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

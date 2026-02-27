"""Background analytics logger.

All DB writes happen via ``BackgroundTasks`` so the student response is
never delayed by a database round-trip.  If the DB is unavailable the
error is logged but **never** propagated to the caller.
"""

from __future__ import annotations

import datetime
import logging

import pandas as pd

from app.config import COURSE_CODE_AND_NAME_COLUMN, FACULTY_COLUMN
from app.database import get_session
from app.models.analytics import FacultyAnalytics, SearchLog

logger = logging.getLogger(__name__)


def _parse_label(label: str) -> tuple[str, str]:
    """Split a combined label like ``'BIL101 (Bilgisayara Giriş)'``.

    Returns ``(course_code, course_name)``.
    """
    if "(" in label and label.endswith(")"):
        code, rest = label.split("(", 1)
        return code.strip().lower(), rest.rstrip(")")
    return label.strip().lower(), label


def _lookup_faculty(df: pd.DataFrame | None, label: str) -> str:
    """Look up the real faculty name from the cached DataFrame.

    Falls back to ``"UNKNOWN"`` if the DataFrame is missing or the
    course label is not found.
    """
    if df is None or FACULTY_COLUMN not in df.columns:
        return "UNKNOWN"

    mask = df[COURSE_CODE_AND_NAME_COLUMN] == label
    matches = df.loc[mask, FACULTY_COLUMN]
    if not matches.empty:
        return str(matches.iloc[0]).strip()
    return "UNKNOWN"


# ── Public background task ───────────────────────────────────────────────────


async def log_search(
    course_labels: list[str],
    language: str = "tr",
    endpoint: str = "schedule",
    df: pd.DataFrame | None = None,
) -> None:
    """Persist one ``SearchLog`` row per course **in the background**.

    Also upserts ``FacultyAnalytics`` counters.

    This function is designed to be handed to ``BackgroundTasks.add_task``
    and must **never** raise — all exceptions are swallowed and logged.
    """
    try:
        session = await get_session()
        if session is None:
            return  # DB not configured — silently skip

        async with session:
            faculty_map: dict[str, int] = {}

            for label in course_labels:
                code, name = _parse_label(label)
                faculty = _lookup_faculty(df, label)

                row = SearchLog(
                    course_code=code,
                    course_name=name,
                    faculty_name=faculty,
                    language=language,
                    endpoint=endpoint,
                )
                session.add(row)

                faculty_map[faculty] = faculty_map.get(faculty, 0) + 1

            # Flush search logs
            await session.flush()

            # Upsert faculty analytics
            for faculty, count in faculty_map.items():
                from sqlmodel import select

                stmt = select(FacultyAnalytics).where(
                    FacultyAnalytics.faculty_name == faculty
                )
                result = await session.execute(stmt)
                fa = result.scalars().first()

                if fa is None:
                    fa = FacultyAnalytics(
                        faculty_name=faculty,
                        search_count=count,
                        unique_courses=len(
                            {
                                c
                                for c in course_labels
                                if _lookup_faculty(df, c) == faculty
                            }
                        ),
                    )
                    session.add(fa)
                else:
                    fa.search_count += count
                    unique = {
                        c for c in course_labels if _lookup_faculty(df, c) == faculty
                    }
                    fa.unique_courses = max(fa.unique_courses, len(unique))
                    fa.last_searched_at = datetime.datetime.now(datetime.timezone.utc)

            await session.commit()

    except Exception:
        logger.exception("Analytics logging failed (non-fatal)")

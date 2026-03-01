"""
Pure business-logic service for exam schedule operations.

All Streamlit / UI dependencies have been removed.
Functions are synchronous but CPU-bound work is kept minimal so they can be
called from async route handlers via ``run_in_executor`` or directly.
"""

from __future__ import annotations

import datetime
import io
import logging
import time
import uuid
from typing import Any

import pandas as pd
import requests
import urllib3
from unidecode import unidecode

from app.config import (
    CLASSROOM_CODE_COLUMN,
    COURSE_CODE_AND_NAME_COLUMN,
    COURSE_CODE_COLUMN,
    COURSE_NAME_COLUMN,
    EXAM_DATE_COLUMN,
    EXAM_FINISH_TIME_COLUMN,
    EXAM_TIME_COLUMN,
    FACULTY_COLUMN,
    settings,
)

# Suppress SSL warnings (halic.edu.tr has certificate issues)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logger = logging.getLogger(__name__)

# ── In-memory cache ──────────────────────────────────────────────────────────

_df_cache: pd.DataFrame | None = None
_courses_cache: list[dict[str, str]] | None = None  # Pre-built for instant /courses
_cache_timestamp: float = 0.0


def _is_cache_valid() -> bool:
    if _df_cache is None:
        return False
    if settings.cache_ttl_seconds == 0:
        return True  # never expires
    return (time.time() - _cache_timestamp) < settings.cache_ttl_seconds


# ── Data fetching & processing ───────────────────────────────────────────────


def fetch_exam_data() -> pd.DataFrame:
    """Download and process the exam-schedule Excel file from Halic University.

    Returns a cleaned, grouped, and sorted ``DataFrame``.

    Raises:
        RuntimeError: If the download or parsing fails.
    """
    url = settings.exam_schedule_url

    try:
        response = requests.get(url, verify=False, timeout=30)
        response.raise_for_status()
    except requests.exceptions.RequestException as exc:
        raise RuntimeError(f"Failed to download exam schedule: {exc}") from exc

    try:
        df = pd.read_excel(io.BytesIO(response.content))
    except Exception as exc:
        raise RuntimeError(f"Failed to parse Excel file: {exc}") from exc

    # ── Clean course code / name (vectorized — 10–50× faster than apply) ───
    df[COURSE_CODE_COLUMN] = df[COURSE_CODE_COLUMN].astype(str).str.split(";").str[0]
    df[COURSE_NAME_COLUMN] = df[COURSE_NAME_COLUMN].astype(str).str.split(";").str[0]
    df[COURSE_CODE_COLUMN] = df[COURSE_CODE_COLUMN].map(
        lambda y: unidecode(y).lower()
    )  # unidecode has no vectorized equivalent
    # ── Clean faculty name (take the first entry from the semicolon list) ───
    if FACULTY_COLUMN in df.columns:
        df[FACULTY_COLUMN] = (
            df[FACULTY_COLUMN].astype(str).str.split(";").str[0].str.strip()
        )
    # ── Clean classroom codes ─────────────────────────────────────────────
    if CLASSROOM_CODE_COLUMN in df.columns:
        df[CLASSROOM_CODE_COLUMN] = (
            df[CLASSROOM_CODE_COLUMN].astype(str).str.replace(";", ",", regex=False)
        )

    # ── Select & aggregate ────────────────────────────────────────────────
    columns_to_use = [
        EXAM_DATE_COLUMN,
        EXAM_TIME_COLUMN,
        COURSE_CODE_COLUMN,
        COURSE_NAME_COLUMN,
    ]
    if EXAM_FINISH_TIME_COLUMN in df.columns:
        columns_to_use.append(EXAM_FINISH_TIME_COLUMN)
    if CLASSROOM_CODE_COLUMN in df.columns:
        columns_to_use.append(CLASSROOM_CODE_COLUMN)
    if FACULTY_COLUMN in df.columns:
        columns_to_use.append(FACULTY_COLUMN)

    df = df[columns_to_use]

    agg_dict: dict[str, Any] = {
        EXAM_DATE_COLUMN: "first",
        EXAM_TIME_COLUMN: "first",
        COURSE_NAME_COLUMN: "first",
    }
    if EXAM_FINISH_TIME_COLUMN in df.columns:
        agg_dict[EXAM_FINISH_TIME_COLUMN] = "first"
    if CLASSROOM_CODE_COLUMN in df.columns:
        agg_dict[CLASSROOM_CODE_COLUMN] = ", ".join
    if FACULTY_COLUMN in df.columns:
        agg_dict[FACULTY_COLUMN] = "first"

    df = df.groupby(COURSE_CODE_COLUMN).agg(agg_dict).reset_index()
    df = df.sort_values(by=EXAM_DATE_COLUMN)

    # Combined label
    df[COURSE_CODE_AND_NAME_COLUMN] = (
        df[COURSE_CODE_COLUMN].str.upper() + " (" + df[COURSE_NAME_COLUMN] + ")"
    )

    return df


def get_exam_dataframe() -> pd.DataFrame:
    """Return the cached exam ``DataFrame``, refreshing if stale."""
    global _df_cache, _courses_cache, _cache_timestamp

    if not _is_cache_valid():
        _df_cache = fetch_exam_data()
        _courses_cache = get_all_courses(_df_cache)
        _cache_timestamp = time.time()

    return _df_cache  # type: ignore[return-value]


def get_cached_courses() -> list[dict[str, str]] | None:
    """Return pre-built course list if cache is valid; otherwise None."""
    global _courses_cache
    if _is_cache_valid() and _courses_cache is not None:
        return _courses_cache
    return None


def invalidate_cache() -> None:
    """Force next call to ``get_exam_dataframe`` to re-fetch."""
    global _df_cache, _courses_cache, _cache_timestamp
    _df_cache = None
    _courses_cache = None
    _cache_timestamp = 0.0


# ── Helpers ──────────────────────────────────────────────────────────────────


def _format_date(date_str: str) -> str:
    """Convert various date formats to ``dd/mm/yyyy``."""
    raw = date_str.split(" ")[0]
    for fmt in ("%Y-%m-%d", "%d.%m.%Y"):
        try:
            return datetime.datetime.strptime(raw, fmt).strftime("%d/%m/%Y")
        except ValueError:
            continue
    raise ValueError(f"Unrecognised date format: {date_str}")


def _parse_exam_time(time_value: str | datetime.time) -> str:
    """Return ``HH:MM`` string from a time value."""
    if isinstance(time_value, str):
        for fmt in ("%H:%M:%S", "%H:%M"):
            try:
                return datetime.datetime.strptime(time_value, fmt).strftime("%H:%M")
            except ValueError:
                continue
        raise ValueError(f"Unrecognised time format: {time_value}")
    return time_value.strftime("%H:%M")


def _lookup_course(df: pd.DataFrame, course_label: str) -> pd.Series:
    """Return the row for *course_label* or raise ``ValueError``."""
    rows = df[df[COURSE_CODE_AND_NAME_COLUMN] == course_label]
    if rows.empty:
        raise ValueError(f"Course '{course_label}' not found in exam schedule")
    return rows.iloc[0]


# ── Public query helpers ─────────────────────────────────────────────────────


def get_all_courses(df: pd.DataFrame) -> list[dict[str, str]]:
    """Return a list of ``{code, name, label}`` dicts for every course.

    Uses vectorized column access instead of iterrows (≈100× faster).
    """
    return [
        {
            "code": code,
            "name": name,
            "label": label,
        }
        for code, name, label in zip(
            df[COURSE_CODE_COLUMN],
            df[COURSE_NAME_COLUMN],
            df[COURSE_CODE_AND_NAME_COLUMN],
        )
    ]


def get_exam_date(df: pd.DataFrame, course_label: str, language: str = "tr") -> str:
    """Return a human-readable exam-date string for *course_label*."""
    row = _lookup_course(df, course_label)
    raw_date: str = row[EXAM_DATE_COLUMN]

    if language == "tr":
        weekday = raw_date.split(" ")[1]
        formatted = f"{_format_date(raw_date)} {weekday}"
    else:
        date_fmt = _format_date(raw_date)
        weekday_en = datetime.datetime.strptime(date_fmt, "%d/%m/%Y").strftime("%A")
        formatted = f"{date_fmt} {weekday_en}"

    start = _parse_exam_time(row[EXAM_TIME_COLUMN])

    if EXAM_FINISH_TIME_COLUMN in df.columns:
        finish = _parse_exam_time(row[EXAM_FINISH_TIME_COLUMN])
        return f"{formatted} {start}-{finish}"
    return f"{formatted} {start}"


def get_course_name(df: pd.DataFrame, course_label: str) -> str:
    """Return the course name for *course_label*."""
    return str(_lookup_course(df, course_label)[COURSE_NAME_COLUMN])


def get_classroom(df: pd.DataFrame, course_label: str) -> list[str]:
    """Return classroom codes as a list of strings (no truncation)."""
    if CLASSROOM_CODE_COLUMN not in df.columns:
        return []
    raw = str(_lookup_course(df, course_label)[CLASSROOM_CODE_COLUMN])
    if not raw or raw == "nan":
        return []
    return [c.strip() for c in raw.split(",") if c.strip()]


# ── Schedule builder ─────────────────────────────────────────────────────────


def build_schedule(
    df: pd.DataFrame,
    course_labels: list[str],
    language: str = "tr",
    include_classroom: bool = False,
) -> list[dict]:
    """Build a sorted list of exam-detail dicts for the given courses.

    Each dict contains ``course_name``, ``exam_date``, and optionally
    ``classrooms`` (list of strings).
    """
    items: list[dict] = []
    for label in course_labels:
        entry: dict = {
            "course_name": get_course_name(df, label),
            "exam_date": get_exam_date(df, label, language),
        }
        if include_classroom:
            entry["classrooms"] = get_classroom(df, label)
        else:
            entry["classrooms"] = []
        items.append(entry)

    # Sort by parsed datetime
    def _sort_key(item: dict[str, str | None]) -> datetime.datetime:
        parts = (item["exam_date"] or "").split()
        time_part = parts[2] if len(parts) >= 3 else "00:00"
        start_time = time_part.split("-")[0] if "-" in time_part else time_part
        return datetime.datetime.strptime(f"{parts[0]} {start_time}", "%d/%m/%Y %H:%M")

    items.sort(key=_sort_key)
    return items


# ── ICS export ───────────────────────────────────────────────────────────────


def generate_ics(
    df: pd.DataFrame,
    course_labels: list[str],
    language: str = "tr",
    exam_type: str = "final",
) -> str:
    """Generate an ICS calendar string for the given courses."""
    schedule = build_schedule(df, course_labels, language, include_classroom=True)

    exam_type_text = {
        ("midterm", "tr"): "Vize",
        ("final", "tr"): "Final",
        ("midterm", "en"): "Midterm",
        ("final", "en"): "Final",
    }.get((exam_type, language), exam_type.title())

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//ExamGenius//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
    ]

    now_stamp = datetime.datetime.now().strftime("%Y%m%dT%H%M%S")

    for item in schedule:
        date_parts = (item["exam_date"] or "").split()
        day, month, year = map(int, date_parts[0].split("/"))
        time_part = date_parts[-1]

        if "-" in time_part:
            s_time, e_time = time_part.split("-")
            sh, sm = map(int, s_time.split(":"))
            eh, em = map(int, e_time.split(":"))
            start_dt = datetime.datetime(year, month, day, sh, sm)
            end_dt = datetime.datetime(year, month, day, eh, em)
        else:
            sh, sm = map(int, time_part.split(":"))
            start_dt = datetime.datetime(year, month, day, sh, sm)
            end_dt = start_dt + datetime.timedelta(hours=2)

        course_name = item["course_name"] or ""
        summary = f"{course_name} {exam_type_text.title()}"
        description = (
            f"{exam_type_text} exam for {course_name}"
            if language == "en"
            else f"{course_name} {exam_type_text.lower()} sınavı"
        )

        lines.extend(
            [
                "BEGIN:VEVENT",
                f"UID:{uuid.uuid4()}",
                f"DTSTAMP:{now_stamp}",
                f"DTSTART:{start_dt:%Y%m%dT%H%M%S}",
                f"DTEND:{end_dt:%Y%m%dT%H%M%S}",
                f"SUMMARY:{summary}",
                f"DESCRIPTION:{description}",
                f"LOCATION:{', '.join(item.get('classrooms') or []) or 'N/A'}",
                "END:VEVENT",
            ]
        )

    lines.append("END:VCALENDAR")
    return "\n".join(lines)


# ── Image export ─────────────────────────────────────────────────────────────


def generate_schedule_image_bytes(
    df: pd.DataFrame,
    course_labels: list[str],
    language: str = "tr",
    include_classroom: bool = False,
) -> bytes:
    """Render the schedule as a PNG and return raw bytes."""
    import plotly.figure_factory as ff  # lazy import — heavy dependency

    schedule = build_schedule(df, course_labels, language, include_classroom)

    col_names = _language_columns(language)
    header = [col_names["course_name"], col_names["exam_date"]]
    if include_classroom:
        header.append(col_names["classroom"])

    table_data = [header]
    for item in schedule:
        row = [item["course_name"], item["exam_date"]]
        if include_classroom:
            row.append(", ".join(item.get("classrooms") or []) or "N/A")
        table_data.append(row)

    course_names = [item["course_name"] or "" for item in schedule]
    scale = 21
    width = max((len(n) * scale for n in course_names), default=800)

    fig = ff.create_table(pd.DataFrame(table_data[1:], columns=table_data[0]))
    fig.layout.width = max(width, 800)
    fig.update_layout(autosize=True)

    return fig.to_image(format="png", scale=2)


def _language_columns(language: str) -> dict[str, str]:
    if language == "tr":
        return {
            "course_name": "Ders Adı",
            "exam_date": "Sınav Tarihi",
            "classroom": "Sınıf",
        }
    return {
        "course_name": "Course Name",
        "exam_date": "Exam Date",
        "classroom": "Classroom Codes",
    }

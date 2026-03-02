"""SQLModel tables for usage analytics.

These models are mapped to real PostgreSQL tables and provide built-in
SQL-injection protection through SQLAlchemy's parameterised queries.
"""

from __future__ import annotations

import datetime

from sqlalchemy import Column, DateTime
from sqlmodel import Field, SQLModel


class SearchLog(SQLModel, table=True):
    """Tracks every schedule search made by a student.

    This is the primary analytics table — one row per POST /schedule,
    POST /export/ics, or POST /export/image request.
    """

    __tablename__ = "search_logs"

    id: int | None = Field(default=None, primary_key=True)
    course_code: str = Field(
        max_length=30,
        index=True,
        description="Normalised course code, e.g. 'bil101'",
    )
    course_name: str = Field(
        max_length=255,
        description="Original course name from the Excel file",
    )
    faculty_name: str = Field(
        max_length=255,
        default="",
        index=True,
        description="Faculty / institute name from the Excel data",
    )
    language: str = Field(
        max_length=5,
        default="tr",
        description="UI language at the time of search (tr / en)",
    )
    endpoint: str = Field(
        max_length=50,
        default="schedule",
        description="Which API endpoint was called (schedule / ics / image)",
    )
    request_id: str = Field(
        max_length=36,
        default="",
        index=True,
        description="Unique request ID to deduplicate duplicate request processing",
    )
    timestamp: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc),
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default="now()",
        ),
        description="UTC timestamp with timezone",
    )


class FacultyAnalytics(SQLModel, table=True):
    """Aggregated usage trends per department / faculty.

    A background job or DB trigger can populate this from SearchLog.
    It is also safe to INSERT directly from the application layer.
    """

    __tablename__ = "faculty_analytics"

    id: int | None = Field(default=None, primary_key=True)
    faculty_name: str = Field(
        max_length=255,
        index=True,
        description="Department or faculty name derived from the course code prefix",
    )
    search_count: int = Field(
        default=0,
        description="Total number of searches attributed to this faculty",
    )
    unique_courses: int = Field(
        default=0,
        description="Number of distinct courses searched under this faculty",
    )
    last_searched_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc),
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default="now()",
        ),
        description="Most recent search timestamp for this faculty",
    )
    period: str = Field(
        max_length=20,
        default="",
        description="Academic period, e.g. '2025-2026-guz'",
    )

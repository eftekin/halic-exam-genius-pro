"""Pydantic schemas for exam-related requests and responses."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


# ── Enums ─────────────────────────────────────────────────────────────────────


class Language(str, Enum):
    TR = "tr"
    EN = "en"


class ExamType(str, Enum):
    MIDTERM = "midterm"
    FINAL = "final"


# ── Response models ───────────────────────────────────────────────────────────


class CourseItem(BaseModel):
    """A single course entry returned by the /courses endpoint."""

    code: str = Field(..., description="Normalized (lowercase, ascii) course code")
    name: str = Field(..., description="Original course name")
    label: str = Field(
        ...,
        description="Combined label shown in the UI, e.g. 'BIL101 (Bilgisayara Giriş)'",
    )


class CoursesResponse(BaseModel):
    """Response for GET /courses."""

    total: int
    courses: list[CourseItem]


class ExamDateDetail(BaseModel):
    """Exam info for a single course."""

    id: str = Field(..., description="Stable unique exam identifier")
    course_name: str
    exam_date: str = Field(
        ..., description="Formatted date string, e.g. '15/01/2026 Perşembe 09:00-11:00'"
    )
    classrooms: list[str] = Field(
        default_factory=list,
        description="List of classroom/room codes",
    )


class ScheduleRequest(BaseModel):
    """Request body for POST /schedule."""

    courses: list[str] = Field(
        ...,
        min_length=1,
        description="List of course labels (COURSE_CODE_AND_NAME format)",
    )
    language: Language = Language.TR
    include_classroom: bool = False


class ScheduleResponse(BaseModel):
    """Response for POST /schedule."""

    schedule: list[ExamDateDetail]


class ICSRequest(BaseModel):
    """Request body for POST /export/ics."""

    courses: list[str] = Field(
        ...,
        min_length=1,
        description="List of course labels (COURSE_CODE_AND_NAME format)",
    )
    language: Language = Language.TR
    exam_type: ExamType = ExamType.FINAL


class ImageRequest(BaseModel):
    """Request body for POST /export/image."""

    courses: list[str] = Field(
        ...,
        min_length=1,
        description="List of course labels (COURSE_CODE_AND_NAME format)",
    )
    language: Language = Language.TR
    include_classroom: bool = False

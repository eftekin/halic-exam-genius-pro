"""Exam-schedule API endpoints."""

from __future__ import annotations

import asyncio
from functools import partial

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.models.exam import (
    CourseItem,
    CoursesResponse,
    ExamDateDetail,
    ICSRequest,
    ImageRequest,
    ScheduleRequest,
    ScheduleResponse,
)
from app.services.exam_service import (
    build_schedule,
    generate_ics,
    generate_schedule_image_bytes,
    get_exam_dataframe,
    invalidate_cache,
)

router = APIRouter(prefix="/api", tags=["Exam Schedule"])


# ── Helpers ──────────────────────────────────────────────────────────────────


async def _get_df():
    """Load the exam DataFrame off the main event-loop thread."""
    loop = asyncio.get_running_loop()
    try:
        return await loop.run_in_executor(None, get_exam_dataframe)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


def _validate_courses(df, labels: list[str]) -> None:
    """Raise 404 if any label is not in the DataFrame."""
    from app.config import COURSE_CODE_AND_NAME_COLUMN

    valid = set(df[COURSE_CODE_AND_NAME_COLUMN].tolist())
    missing = [c for c in labels if c not in valid]
    if missing:
        raise HTTPException(
            status_code=404,
            detail=f"Courses not found: {missing}",
        )


# ── Endpoints ────────────────────────────────────────────────────────────────


@router.get(
    "/courses",
    response_model=CoursesResponse,
    summary="List all available courses",
)
async def list_courses():
    """Return every course from the current exam schedule."""
    df = await _get_df()

    from app.services.exam_service import get_all_courses

    courses_raw = get_all_courses(df)
    courses = [CourseItem(**c) for c in courses_raw]
    return CoursesResponse(total=len(courses), courses=courses)


@router.post(
    "/schedule",
    response_model=ScheduleResponse,
    summary="Get exam schedule for selected courses",
)
async def get_schedule(body: ScheduleRequest):
    """Build a sorted exam schedule for the provided course list."""
    df = await _get_df()
    _validate_courses(df, body.courses)

    loop = asyncio.get_running_loop()
    try:
        items = await loop.run_in_executor(
            None,
            partial(
                build_schedule,
                df,
                body.courses,
                body.language.value,
                body.include_classroom,
            ),
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    schedule = [ExamDateDetail(**item) for item in items]
    return ScheduleResponse(schedule=schedule)


@router.post(
    "/export/ics",
    summary="Export exam schedule as ICS calendar file",
    response_class=Response,
    responses={200: {"content": {"text/calendar": {}}}},
)
async def export_ics(body: ICSRequest):
    """Generate and return an ICS file for the selected courses."""
    df = await _get_df()
    _validate_courses(df, body.courses)

    loop = asyncio.get_running_loop()
    try:
        ics_content = await loop.run_in_executor(
            None,
            partial(
                generate_ics,
                df,
                body.courses,
                body.language.value,
                body.exam_type.value,
            ),
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={"Content-Disposition": "attachment; filename=exam_schedule.ics"},
    )


@router.post(
    "/export/image",
    summary="Export exam schedule as a PNG image",
    response_class=Response,
    responses={200: {"content": {"image/png": {}}}},
)
async def export_image(body: ImageRequest):
    """Render the schedule as a PNG table image."""
    df = await _get_df()
    _validate_courses(df, body.courses)

    loop = asyncio.get_running_loop()
    try:
        img_bytes = await loop.run_in_executor(
            None,
            partial(
                generate_schedule_image_bytes,
                df,
                body.courses,
                body.language.value,
                body.include_classroom,
            ),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Image generation failed: {exc}"
        ) from exc

    return Response(
        content=img_bytes,
        media_type="image/png",
        headers={"Content-Disposition": "attachment; filename=exam_schedule.png"},
    )


@router.post(
    "/cache/invalidate",
    summary="Force-refresh cached exam data",
    status_code=204,
)
async def invalidate():
    """Clear the in-memory cache so the next request re-downloads the Excel."""
    invalidate_cache()

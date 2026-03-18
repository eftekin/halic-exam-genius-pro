/**
 * API client for the Haliç Exam Genius backend.
 *
 * Provides typed fetch helpers for courses, schedules, and ICS export.
 * Base URL defaults to `http://localhost:8000` and can be overridden
 * via the `NEXT_PUBLIC_API_URL` environment variable.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Types ────────────────────────────────────────────────────────────────────

/** A single course entry from the backend. */
export interface Course {
  code: string;
  name: string;
  label: string;
}

/** Response shape for the `GET /api/courses` endpoint. */
export interface CoursesResponse {
  total: number;
  courses: Course[];
}

/** Exam information for a single course. */
export interface ExamDetail {
  id: string;
  course_name: string;
  exam_date: string;
  classrooms: string[];
}

/** Response shape for the `POST /api/schedule` endpoint. */
export interface ScheduleResponse {
  schedule: ExamDetail[];
}

export type Language = "tr" | "en";

// ── Fetchers ─────────────────────────────────────────────────────────────────

/** Fetch all available courses from the backend. */
export async function fetchCourses(): Promise<CoursesResponse> {
  const res = await fetch(`${API_BASE}/api/courses`);
  if (!res.ok) {
    throw new Error(`Failed to fetch courses (${res.status})`);
  }
  return res.json();
}

/** Fetch the exam schedule for the given course labels. */
export async function fetchSchedule(
  courses: string[],
  language: Language = "tr",
  includeClassroom = true,
): Promise<ScheduleResponse> {
  const res = await fetch(`${API_BASE}/api/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      courses,
      language,
      include_classroom: includeClassroom,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? `Failed to fetch schedule (${res.status})`);
  }
  return res.json();
}

/** Export an ICS calendar file blob for the given courses. */
export async function exportICS(
  courses: string[],
  language: Language = "tr",
  examType: "midterm" | "final" = "final",
): Promise<Blob> {
  const res = await fetch(`${API_BASE}/api/export/ics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      courses,
      language,
      exam_type: examType,
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to export ICS (${res.status})`);
  }
  return res.blob();
}

// ── API client for the Exam Genius backend ──────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Course {
  code: string;
  name: string;
  label: string;
}

export interface CoursesResponse {
  total: number;
  courses: Course[];
}

export interface ExamDetail {
  course_name: string;
  exam_date: string;
  classrooms: string[];
}

export interface ScheduleResponse {
  schedule: ExamDetail[];
}

export type Language = "tr" | "en";

// ── Fetchers ─────────────────────────────────────────────────────────────────

export async function fetchCourses(): Promise<CoursesResponse> {
  const res = await fetch(`${API_BASE}/api/courses`);
  if (!res.ok) {
    throw new Error(`Failed to fetch courses (${res.status})`);
  }
  return res.json();
}

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

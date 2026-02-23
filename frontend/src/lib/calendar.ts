// ── Calendar helpers: date parsing & ICS generation ─────────────────────────
//
// Backend exam_date format:
//   "DD/MM/YYYY DayName HH:MM-HH:MM"
//   e.g. "03/01/2026 Cumartesi 19:00-20:00"

import type { ExamDetail } from "@/lib/api";
import type { Translations } from "@/lib/i18n";

export interface ParsedExamDateTime {
  /** YYYY-MM-DD */
  startDate: string;
  /** HH:MM (24h) — empty if absent */
  startTime: string;
  /** HH:MM (24h) — empty if absent */
  endTime: string;
}

/**
 * Parse the raw exam_date string into structured parts.
 */
export function parseExamDateTime(raw: string): ParsedExamDateTime {
  const parts = raw.trim().split(/\s+/);

  const datePart = parts[0] ?? "";
  const [dd, mm, yyyy] = datePart.split("/");
  const startDate = dd && mm && yyyy ? `${yyyy}-${mm}-${dd}` : "";

  const timePart = parts.slice(2).join(" ");
  let startTime = "";
  let endTime = "";

  if (timePart.includes("-")) {
    const [s, e] = timePart.split("-");
    startTime = (s ?? "").trim();
    endTime = (e ?? "").trim();
  } else if (timePart) {
    startTime = timePart.trim();
  }

  return { startDate, startTime, endTime };
}

// ── ICS helpers ──────────────────────────────────────────────────────────────

/** Pad a number to 2 digits */
function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * Convert "YYYY-MM-DD" + "HH:MM" (Istanbul local) → ICS TZID datetime string.
 * Returns e.g. "20260103T190000"
 */
function toICSDatetime(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return `${y}${pad2(m)}${pad2(d)}T${pad2(h)}${pad2(min)}00`;
}

/** ICS-safe text escaping */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** Generate a simple UID for each event */
function generateUID(index: number): string {
  const ts = Date.now();
  return `exam-${index}-${ts}@halic-exam-genius`;
}

/**
 * Generate a single RFC 5545 compliant .ics string containing
 * multiple VEVENT blocks — one per exam.
 *
 * When opened on iOS/macOS it triggers "Add N events to calendar?".
 * On Android it opens the default calendar app for each event.
 */
export function generateMultiICS(exams: ExamDetail[], t: Translations): string {
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${pad2(now.getUTCMonth() + 1)}${pad2(now.getUTCDate())}T${pad2(now.getUTCHours())}${pad2(now.getUTCMinutes())}${pad2(now.getUTCSeconds())}Z`;

  const events = exams
    .map((exam, i) => {
      const { startDate, startTime, endTime } = parseExamDateTime(
        exam.exam_date,
      );
      if (!startDate || !startTime) return null;

      const dtStart = toICSDatetime(startDate, startTime);
      const dtEnd = endTime
        ? toICSDatetime(startDate, endTime)
        : toICSDatetime(startDate, startTime); // fallback: zero-duration

      const location = exam.classrooms?.join(", ") ?? "";

      return [
        "BEGIN:VEVENT",
        `UID:${generateUID(i)}`,
        `DTSTAMP:${stamp}`,
        `DTSTART;TZID=Europe/Istanbul:${dtStart}`,
        `DTEND;TZID=Europe/Istanbul:${dtEnd}`,
        `SUMMARY:${escapeICS(t.ics_summary(exam.course_name))}`,
        location ? `LOCATION:${escapeICS(location)}` : "",
        `DESCRIPTION:${escapeICS(t.ics_description(exam.course_name))}`,
        "STATUS:CONFIRMED",
        "END:VEVENT",
      ]
        .filter(Boolean)
        .join("\r\n");
    })
    .filter(Boolean);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Halic Exam Genius//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-TIMEZONE:Europe/Istanbul",
    // Minimal VTIMEZONE for Europe/Istanbul
    "BEGIN:VTIMEZONE",
    "TZID:Europe/Istanbul",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0300",
    "TZOFFSETTO:+0300",
    "END:STANDARD",
    "END:VTIMEZONE",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

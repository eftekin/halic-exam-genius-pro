import type { Exam } from "@/lib/api";
import type { Translations } from "@/lib/i18n";

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

// Istanbul wall clock as written in the Excel, used with TZID=Europe/Istanbul; never converted.
function toICSDatetime(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return `${y}${pad2(m)}${pad2(d)}T${pad2(h)}${pad2(min)}00`;
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function generateMultiICS(exams: Exam[], t: Translations): string {
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${pad2(now.getUTCMonth() + 1)}${pad2(now.getUTCDate())}T${pad2(now.getUTCHours())}${pad2(now.getUTCMinutes())}${pad2(now.getUTCSeconds())}Z`;

  const events = exams.map((exam) => {
    const location = exam.rooms.join(", ");
    return [
      "BEGIN:VEVENT",
      // Stable UID: importing the file again updates events instead of duplicating them
      `UID:${exam.id}@halic-exam-genius`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Europe/Istanbul:${toICSDatetime(exam.date, exam.start)}`,
      `DTEND;TZID=Europe/Istanbul:${toICSDatetime(exam.date, exam.end)}`,
      `SUMMARY:${escapeICS(t.ics_summary(exam.name))}`,
      location ? `LOCATION:${escapeICS(location)}` : "",
      `DESCRIPTION:${escapeICS(t.ics_description(exam.name))}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
    ]
      .filter(Boolean)
      .join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Halic Exam Genius//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-TIMEZONE:Europe/Istanbul",
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

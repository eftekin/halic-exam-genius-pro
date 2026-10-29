import type { Exam } from "@/lib/api";
import type { Lang } from "@/lib/i18n";

export function formatDate(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

// Pinned to UTC so the device time zone can't shift the day.
export function weekday(date: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-US", {
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function sessionLabel(exam: Exam, sectionWord: string): string {
  return [exam.section && `${sectionWord} ${exam.section}`, exam.program]
    .filter(Boolean)
    .join(" · ");
}

export function compareExams(a: Exam, b: Exam): number {
  return (
    `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`) ||
    a.code.localeCompare(b.code)
  );
}

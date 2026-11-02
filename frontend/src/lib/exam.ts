import type { Exam } from "@/lib/api";
import type { Lang } from "@/lib/i18n";

export function formatDate(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

// Pinned to UTC so the device time zone can't shift the day.
function formatPart(
  date: string,
  lang: Lang,
  part: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-US", {
    ...part,
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function weekday(date: string, lang: Lang): string {
  return formatPart(date, lang, { weekday: "long" });
}

export function weekdayShort(date: string, lang: Lang): string {
  return formatPart(date, lang, { weekday: "short" });
}

export function dayOfMonth(date: string): number {
  return Number(date.slice(8));
}

function monthName(date: string, lang: Lang): string {
  return formatPart(date, lang, { month: "long" });
}

export function dayLabel(date: string, lang: Lang): string {
  return `${weekday(date, lang)}, ${dayOfMonth(date)} ${monthName(date, lang)}`;
}

export function examDays(exams: Exam[]): string[] {
  return [...new Set(exams.map((e) => e.date))].sort();
}

export function periodLabel(days: string[], lang: Lang): string {
  const first = days[0];
  const last = days[days.length - 1];
  const lastLabel = `${dayOfMonth(last)} ${monthName(last, lang)}`;
  if (first === last) return lastLabel;
  return first.slice(0, 7) === last.slice(0, 7)
    ? `${dayOfMonth(first)}-${lastLabel}`
    : `${dayOfMonth(first)} ${monthName(first, lang)}-${lastLabel}`;
}

export function groupByDay(sorted: Exam[]): { date: string; exams: Exam[] }[] {
  const days = new Map<string, Exam[]>();
  for (const exam of sorted) {
    const day = days.get(exam.date);
    if (day) day.push(exam);
    else days.set(exam.date, [exam]);
  }
  return [...days].map(([date, exams]) => ({ date, exams }));
}

export function sessionLabel(exam: Exam, sectionWord: string): string {
  return [exam.section && `${sectionWord} ${exam.section}`, exam.program]
    .filter(Boolean)
    .join(" · ");
}

// Plain toLowerCase turns İ into i + a combining dot, so "ingilizce" would never match.
function foldForSearch(text: string): string {
  return text
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ı/g, "i");
}

export function matchesCourse(course: Exam, query: string): boolean {
  const q = foldForSearch(query);
  const name = foldForSearch(course.name);
  const words = name.split(/\s+/);

  if (
    foldForSearch(course.code).includes(q) ||
    foldForSearch(course.search_code).includes(q) ||
    name.includes(q) ||
    words.map((w) => w[0] ?? "").join("") === q
  )
    return true;

  return q
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => words.some((w) => w.startsWith(token)));
}

export function compareExams(a: Exam, b: Exam): number {
  return (
    `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`) ||
    a.code.localeCompare(b.code)
  );
}

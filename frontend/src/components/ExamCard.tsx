"use client";

import { memo } from "react";
import { Calendar, Clock, MapPin } from "lucide-react";
import type { ExamDetail } from "@/lib/api";
import type { Translations } from "@/lib/i18n";

/**
 * Split a raw exam-date string (e.g. "15/01/2026 Perşembe 09:00-11:00")
 * into its date, weekday, and time components.
 */
function parseExamDate(raw: string | undefined) {
  if (!raw) return { date: "", weekday: "", time: "" };
  const parts = raw.split(" ");
  const date = parts[0] ?? "";
  const weekday = parts[1] ?? "";
  const time = parts.slice(2).join(" ");
  return { date, weekday, time };
}

interface ExamCardProps {
  exam: ExamDetail;
  index?: number;
  t: Translations;
}

const ExamCard = memo(function ExamCard({ exam, index = 0, t }: ExamCardProps) {
  const { date, weekday, time } = parseExamDate(exam.exam_date);
  const hasClassrooms =
    exam.classrooms && exam.classrooms.filter((r) => r.trim()).length > 0;
  const isEven = index % 2 === 0;
  const courseName = exam.course_name?.trim() || "Ders Adı Yok";

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border px-4 py-3 ${
        isEven
          ? "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          : "border-zinc-100 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/60"
      }`}
    >
      {/* ── Header: Course Name + Exam Type ── */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 text-base font-bold leading-snug text-zinc-900 dark:text-zinc-100">
          {courseName}
        </h3>
        <span className="shrink-0 rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
          {t.exam_type}
        </span>
      </div>

      {/* ── Body: Date/Time + Location ── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        {/* Date & Time */}
        {date && (
          <div className="flex min-w-36 shrink-0 items-center gap-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {date} {weekday}
            </span>
            {time && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {time}
              </span>
            )}
          </div>
        )}

        {/* Location */}
        {hasClassrooms && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
            <div className="flex flex-wrap gap-1">
              {exam.classrooms
                .filter((r) => r.trim())
                .map((room) => (
                  <span
                    key={room}
                    className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {room.trim()}
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default ExamCard;

export function ExamCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div className="h-5 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-4 w-12 rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>
      <div className="flex gap-5">
        <div className="h-3.5 w-28 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3.5 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>
    </div>
  );
}

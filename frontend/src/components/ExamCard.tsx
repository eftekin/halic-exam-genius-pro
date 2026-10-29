"use client";

import { Calendar, Clock, MapPin } from "lucide-react";
import { memo } from "react";
import type { Exam } from "@/lib/api";
import { formatDate, sessionLabel, weekday } from "@/lib/exam";
import type { Lang, Translations } from "@/lib/i18n";

interface ExamCardProps {
  exam: Exam;
  index?: number;
  lang: Lang;
  t: Translations;
}

const ExamCard = memo(function ExamCard({
  exam,
  index = 0,
  lang,
  t,
}: ExamCardProps) {
  const session = sessionLabel(exam, t.section);
  const isEven = index % 2 === 0;

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border px-4 py-3 ${
        isEven
          ? "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          : "border-zinc-100 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold leading-snug text-zinc-900 dark:text-zinc-100">
            {exam.name}
          </h3>
          {session && (
            <p className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {exam.code} · {session}
            </p>
          )}
        </div>
        <span className="shrink-0 rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
          {t.exam_type}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <div className="flex min-w-36 shrink-0 items-center gap-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            {formatDate(exam.date)} {weekday(exam.date, lang)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {exam.start}-{exam.end}
          </span>
        </div>

        {exam.rooms.length > 0 && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
            <div className="flex flex-wrap gap-1">
              {exam.rooms.map((room) => (
                <span
                  key={room}
                  className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {room}
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

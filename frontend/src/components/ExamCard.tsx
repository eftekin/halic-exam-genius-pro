"use client";

import { Calendar, Clock, MapPin } from "lucide-react";
import type { ExamDetail } from "@/lib/api";
import type { Translations } from "@/lib/i18n";

/* ── Accent palette — elegant university tones ────────────────────── */
const ACCENTS = [
  {
    dot: "bg-rose-500",
    badge: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
  },
  {
    dot: "bg-sky-500",
    badge: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  },
  {
    dot: "bg-amber-500",
    badge:
      "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  },
  {
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  {
    dot: "bg-violet-500",
    badge:
      "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  },
  {
    dot: "bg-teal-500",
    badge: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400",
  },
];

function parseExamDate(raw: string) {
  const parts = raw.split(" ");
  const date = parts[0] ?? "";
  const weekday = parts[1] ?? "";
  const time = parts.slice(2).join(" ");
  return { date, weekday, time };
}

/* ── Props ─────────────────────────────────────────────────────────── */
interface ExamCardProps {
  exam: ExamDetail;
  index: number;
  t: Translations;
}

export default function ExamCard({ exam, index, t }: ExamCardProps) {
  const accent = ACCENTS[index % ACCENTS.length];
  const { date, weekday, time } = parseExamDate(exam.exam_date);
  const hasClassrooms = exam.classrooms && exam.classrooms.length > 0;

  return (
    <div
      className="animate-card-in hover-glow rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md dark:border-zinc-800/50 dark:bg-zinc-900/60"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* ── Header row ─────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        {/* Accent dot */}
        <div
          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${accent.dot}`}
        />

        <div className="min-w-0 flex-1">
          {/* Course name */}
          <h3 className="text-[15px] font-semibold leading-snug text-slate-900 dark:text-zinc-50">
            {exam.course_name}
          </h3>

          {/* Exam type badge */}
          <span
            className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${accent.badge}`}
          >
            {t.exam_type}
          </span>
        </div>
      </div>

      {/* ── Meta row ───────────────────────────────────────────── */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-slate-500 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
          {date} {weekday}
        </span>

        {time && (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
            {time}
          </span>
        )}
      </div>

      {/* ── Classroom badges ───────────────────────────────────── */}
      {hasClassrooms && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-zinc-500" />
          {exam.classrooms.map((room) => (
            <span
              key={room}
              className="inline-block rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {room.trim()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Skeleton loader ──────────────────────────────────────────────── */
export function ExamCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200/60 bg-white p-4 dark:border-zinc-800/50 dark:bg-zinc-900/60">
      <div className="flex items-start gap-3">
        <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-zinc-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded-lg bg-slate-200 dark:bg-zinc-700" />
          <div className="h-4 w-16 rounded-md bg-slate-200 dark:bg-zinc-700" />
        </div>
      </div>
      <div className="mt-3 flex gap-4">
        <div className="h-3.5 w-28 rounded-lg bg-slate-200 dark:bg-zinc-700" />
        <div className="h-3.5 w-20 rounded-lg bg-slate-200 dark:bg-zinc-700" />
      </div>
    </div>
  );
}

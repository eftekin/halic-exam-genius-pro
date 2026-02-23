"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { GraduationCap } from "lucide-react";
import {
  fetchCourses,
  fetchSchedule,
  type Course,
  type ExamDetail,
} from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import CourseSelector from "@/components/CourseSelector";
import ExamCard, { ExamCardSkeleton } from "@/components/ExamCard";
import { EmptyState, ErrorState } from "@/components/States";
import ExportBar from "@/components/ExportBar";

export default function Home() {
  const { lang, t } = useLanguage();

  /* ── Data state ──────────────────────────────────────────────── */
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Course[]>([]);
  const [schedule, setSchedule] = useState<ExamDetail[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const scheduleRef = useRef<HTMLDivElement>(null);

  /* ── Load courses ────────────────────────────────────────────── */
  const loadCourses = useCallback(async () => {
    setCoursesLoading(true);
    setCoursesError(null);
    try {
      const data = await fetchCourses();
      setCourses(data.courses);
    } catch (err) {
      setCoursesError(
        err instanceof Error ? err.message : t.courses_load_error,
      );
    } finally {
      setCoursesLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  /* ── Fetch schedule on selection change ──────────────────────── */
  useEffect(() => {
    if (selected.length === 0) {
      setSchedule([]);
      return;
    }

    let cancelled = false;

    async function load() {
      setScheduleLoading(true);
      setScheduleError(null);
      try {
        const data = await fetchSchedule(
          selected.map((c) => c.label),
          lang === "tr" ? "tr" : "en",
          true,
        );
        if (!cancelled) setSchedule(data.schedule);
      } catch (err) {
        if (!cancelled) {
          setScheduleError(
            err instanceof Error ? err.message : t.schedule_load_error,
          );
        }
      } finally {
        if (!cancelled) setScheduleLoading(false);
      }
    }

    const tm = setTimeout(load, 300);
    return () => {
      cancelled = true;
      clearTimeout(tm);
    };
  }, [selected, lang, t]);

  /* ── Derived ─────────────────────────────────────────────────── */
  const courseLabels = selected.map((c) => c.label);
  const showResults = selected.length > 0;
  const hasSchedule = !scheduleLoading && !scheduleError && schedule.length > 0;

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-slate-50 dark:bg-zinc-950">
      {/* ── Sticky Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.04)] glass-panel dark:border-zinc-800/50">
        <div className="px-4 pb-4 pt-safe">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/10">
              <GraduationCap className="h-[18px] w-[18px] text-white" />
            </div>
            <div>
              <h1 className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-zinc-50">
                Exam Genius
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-zinc-500">
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* Course selector */}
          <div className="mt-3.5">
            {coursesError ? (
              <ErrorState message={coursesError} onRetry={loadCourses} t={t} />
            ) : (
              <CourseSelector
                courses={courses}
                selected={selected}
                onChange={setSelected}
                isLoading={coursesLoading}
                t={t}
              />
            )}
          </div>
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <main className={`flex-1 px-4 pt-4 ${hasSchedule ? "pb-28" : "pb-8"}`}>
        {/* Empty state */}
        {!showResults && !scheduleLoading && <EmptyState t={t} />}

        {/* Error state */}
        {scheduleError && (
          <ErrorState
            message={scheduleError}
            onRetry={() => setSelected([...selected])}
            t={t}
          />
        )}

        {/* Skeleton loading */}
        {scheduleLoading && (
          <div className="space-y-3">
            {Array.from({ length: selected.length || 3 }).map((_, i) => (
              <ExamCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Results */}
        {hasSchedule && (
          <>
            <p className="mb-3 text-[13px] font-medium text-slate-500 dark:text-zinc-400">
              {t.exams_listed(schedule.length)}
            </p>

            <div ref={scheduleRef} className="space-y-3">
              {schedule.map((exam, i) => (
                <ExamCard
                  key={exam.course_name + i}
                  exam={exam}
                  index={i}
                  t={t}
                />
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="mt-10 pb-4 text-center text-[11px] text-slate-400 dark:text-zinc-600">
          {t.footer} &copy; {new Date().getFullYear()}
        </footer>
      </main>

      {/* ── Bottom Action Bar ─────────────────────────────────────── */}
      {hasSchedule && (
        <ExportBar
          courseLabels={courseLabels}
          exams={schedule}
          scheduleRef={scheduleRef}
          t={t}
        />
      )}
    </div>
  );
}

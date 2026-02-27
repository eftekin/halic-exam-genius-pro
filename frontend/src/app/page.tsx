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
import ExportView from "@/components/ExportView";
import {
  ACADEMIC_YEAR,
  SEMESTER_TR,
  SEMESTER_EN,
  EXAM_TYPE_TR,
  EXAM_TYPE_EN,
} from "@/config/constants";

/* Stable empty array — never creates a new reference */
const EMPTY_SCHEDULE: ExamDetail[] = [];

export default function Home() {
  const { lang, t } = useLanguage();
  const tRef = useRef(t);
  tRef.current = t;

  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Course[]>([]);
  const [schedule, setSchedule] = useState<ExamDetail[]>(EMPTY_SCHEDULE);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const exportRef = useRef<HTMLDivElement>(null);

  /* Load courses */
  const loadCourses = useCallback(async () => {
    setCoursesLoading(true);
    setCoursesError(null);
    try {
      const data = await fetchCourses();
      setCourses(data.courses);
    } catch (err) {
      setCoursesError(
        err instanceof Error ? err.message : tRef.current.courses_load_error,
      );
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  /* Fetch schedule */
  useEffect(() => {
    if (selected.length === 0) {
      setSchedule(EMPTY_SCHEDULE);
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
            err instanceof Error
              ? err.message
              : tRef.current.schedule_load_error,
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
  }, [selected, lang]);

  const courseLabels = selected.map((c) => c.label);
  const showResults = selected.length > 0;
  const hasSchedule = schedule.length > 0 && !scheduleError;
  const showSkeletons = scheduleLoading && schedule.length === 0;

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col bg-white dark:bg-zinc-950">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="px-4 pb-4 pt-safe">
          {/* Branding row */}
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/20">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>

            {/* Title stack */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl dark:text-zinc-50">
                  Exam Genius
                </h1>
                {/* Semester badge */}
                <span className="inline-flex items-center rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {ACADEMIC_YEAR} {lang === "tr" ? SEMESTER_TR : SEMESTER_EN} |{" "}
                  {lang === "tr" ? EXAM_TYPE_TR : EXAM_TYPE_EN}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="mt-3">
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

      {/* Main — pb-28 to reserve space for export bar */}
      <main className="flex-1 px-4 pb-28 pt-4">
        {!showResults && !scheduleLoading && <EmptyState t={t} />}

        {scheduleError && (
          <ErrorState
            message={scheduleError}
            onRetry={() => setSelected([...selected])}
            t={t}
          />
        )}

        {showSkeletons && (
          <div className="grid grid-cols-1 gap-2">
            {Array.from({ length: selected.length || 3 }).map((_, i) => (
              <ExamCardSkeleton key={i} />
            ))}
          </div>
        )}

        {hasSchedule && (
          <>
            {/* Result header */}
            <div className="mb-4 rounded-xl border border-indigo-500/15 bg-linear-to-r from-indigo-500/5 via-indigo-500/10 to-indigo-500/5 px-4 py-3 dark:border-indigo-500/20">
              <h2 className="text-lg font-bold tracking-tight text-zinc-900 md:text-xl dark:text-zinc-50">
                {ACADEMIC_YEAR} {lang === "tr" ? SEMESTER_TR : SEMESTER_EN}
                {" | "}
                {lang === "tr" ? EXAM_TYPE_TR : EXAM_TYPE_EN}{" "}
                {lang === "tr" ? "Sınav Programı" : "Exam Schedule"}
              </h2>
              <p className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {t.exams_listed(schedule.length)}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {schedule.map((exam, i) => (
                <ExamCard
                  key={`${exam.course_name}-${exam.exam_date}`}
                  exam={exam}
                  index={i}
                  t={t}
                />
              ))}
            </div>
          </>
        )}

        <footer className="mt-10 pb-4 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
          {t.footer} &copy; {new Date().getFullYear()}
        </footer>
      </main>

      {/* Off-screen export table (PNG source) */}
      <ExportView ref={exportRef} exams={schedule} t={t} lang={lang} />

      {/* Fixed bottom action bar */}
      <ExportBar
        courseLabels={courseLabels}
        exams={schedule}
        scheduleRef={exportRef}
        t={t}
        disabled={!hasSchedule}
      />
    </div>
  );
}

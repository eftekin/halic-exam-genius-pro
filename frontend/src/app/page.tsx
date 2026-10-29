"use client";

import { GraduationCap, Star } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CourseSelector from "@/components/CourseSelector";
import ExamCard from "@/components/ExamCard";
import ExportBar from "@/components/ExportBar";
import ExportView from "@/components/ExportView";
import GitHubIcon, {
  REPO_URL,
  UPDATE_SCHEDULE_URL,
} from "@/components/GitHubIcon";
import { EmptyState, ErrorState } from "@/components/States";
import {
  ACADEMIC_YEAR,
  EXAM_TYPE_EN,
  EXAM_TYPE_TR,
  SEMESTER_EN,
  SEMESTER_TR,
} from "@/config/constants";
import { type Exam, fetchExams } from "@/lib/api";
import { compareExams } from "@/lib/exam";
import { useLanguage } from "@/lib/i18n";

export default function Home() {
  const { lang, t } = useLanguage();
  const tRef = useRef(t);
  tRef.current = t;

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Exam[]>([]);

  const exportRef = useRef<HTMLDivElement>(null);

  const loadExams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setExams(await fetchExams());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : tRef.current.courses_load_error,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const schedule = useMemo(() => [...selected].sort(compareExams), [selected]);
  const hasSchedule = schedule.length > 0;

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col bg-white dark:bg-zinc-950">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="px-4 pb-4 pt-safe">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/20">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl dark:text-zinc-50">
                  Exam Genius
                </h1>
                <span className="inline-flex items-center rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {ACADEMIC_YEAR} {lang === "tr" ? SEMESTER_TR : SEMESTER_EN} |{" "}
                  {lang === "tr" ? EXAM_TYPE_TR : EXAM_TYPE_EN}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                {t.subtitle}
              </p>
            </div>

            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Star on GitHub"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <GitHubIcon className="h-4 w-4" />
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              Star
            </a>
          </div>

          <div className="mt-3">
            {error ? (
              <ErrorState message={error} onRetry={loadExams} t={t} />
            ) : (
              <CourseSelector
                exams={exams}
                selected={selected}
                onChange={setSelected}
                isLoading={loading}
                t={t}
              />
            )}
          </div>
        </div>
      </header>

      {/* pb-28 reserves space for the fixed export bar */}
      <main className="flex-1 px-4 pb-28 pt-4">
        {!hasSchedule && <EmptyState t={t} />}

        {hasSchedule && (
          <>
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
                  key={exam.id}
                  exam={exam}
                  index={i}
                  lang={lang}
                  t={t}
                />
              ))}
            </div>
          </>
        )}

        <footer className="mt-10 pb-4 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
          <a
            href={UPDATE_SCHEDULE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-2 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <GitHubIcon className="h-3.5 w-3.5" />
            {t.update_on_github}
          </a>
          <div>
            {t.footer} &copy; {new Date().getFullYear()}
          </div>
        </footer>
      </main>

      <ExportView ref={exportRef} exams={schedule} t={t} lang={lang} />

      <ExportBar
        exams={schedule}
        scheduleRef={exportRef}
        t={t}
        disabled={!hasSchedule}
      />
    </div>
  );
}

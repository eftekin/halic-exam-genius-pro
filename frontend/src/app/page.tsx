"use client";

import { Star } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CourseSelector from "@/components/CourseSelector";
import DayStrip from "@/components/DayStrip";
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
import {
  compareExams,
  dayLabel,
  examDays,
  groupByDay,
  periodLabel,
} from "@/lib/exam";
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
    } catch {
      setError(tRef.current.courses_load_error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const days = useMemo(() => examDays(exams), [exams]);
  const schedule = useMemo(() => [...selected].sort(compareExams), [selected]);
  const groups = useMemo(() => groupByDay(schedule), [schedule]);
  const markedDays = useMemo(() => new Set(examDays(schedule)), [schedule]);
  const hasSchedule = schedule.length > 0;

  const term = `${ACADEMIC_YEAR} ${lang === "tr" ? SEMESTER_TR : SEMESTER_EN} · ${
    lang === "tr" ? EXAM_TYPE_TR : EXAM_TYPE_EN
  }`;

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col bg-background">
      <header className="relative top-0 z-40 border-b-2 border-brand bg-background [@media(min-height:620px)]:sticky">
        <div className="flex flex-col gap-3 px-4 pb-3.5 pt-safe">
          <div className="flex items-center gap-2.5">
            <Image
              src="/favicon.svg"
              alt=""
              width={44}
              height={44}
              className="size-9 shrink-0 md:size-11"
            />

            <div className="min-w-0 flex-1">
              <h1 className="text-[21px] font-bold leading-tight md:text-[28px]">
                Exam Genius
              </h1>
              <p className="mt-0.5 font-mono text-[11.5px] font-medium text-brand md:text-[12.5px]">
                {term.toLocaleUpperCase(lang)}
              </p>
            </div>

            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.star_on_github}
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 px-1 text-[13px] font-semibold text-muted hover:text-brand md:text-sm"
            >
              <GitHubIcon className="h-4 w-4" />
              Star
              <Star className="h-3.5 w-3.5 fill-current" />
            </a>
          </div>

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

          {hasSchedule && (
            <DayStrip
              days={days}
              marked={markedDays}
              label={`${t.exam_period}, ${periodLabel(days, lang)}`}
              lang={lang}
            />
          )}
        </div>
      </header>

      {/* Bottom padding keeps the last exam clear of the fixed bottom bar */}
      <main className={`flex-1 px-4 pt-3.5 ${hasSchedule ? "pb-36" : "pb-20"}`}>
        {!hasSchedule && !error && (
          <EmptyState days={days} sessions={exams.length} lang={lang} t={t} />
        )}

        {hasSchedule && (
          <div className="flex flex-col gap-3">
            {groups.map((group) => (
              <section key={group.date}>
                <h2 className="border-b border-foreground pb-1 pt-1.5 text-[13px] font-bold md:text-sm">
                  {dayLabel(group.date, lang)}
                </h2>
                {group.exams.map((exam) => (
                  <ExamCard key={exam.id} exam={exam} t={t} />
                ))}
              </section>
            ))}
          </div>
        )}
      </main>

      <ExportView
        ref={exportRef}
        exams={schedule}
        days={days}
        t={t}
        lang={lang}
      />

      <div className="fixed inset-x-0 bottom-0 z-30 bg-background">
        <div
          className={`mx-auto flex max-w-2xl flex-col gap-2 px-4 pt-2.5 pb-safe ${
            hasSchedule ? "border-t-2 border-brand" : "border-t border-border"
          }`}
        >
          <ExportBar
            exams={schedule}
            scheduleRef={exportRef}
            t={t}
            disabled={!hasSchedule}
          />
          <footer className="flex flex-wrap justify-center gap-x-5 gap-y-0.5 text-center text-[11.5px] text-muted md:text-[12.5px]">
            <a
              href={UPDATE_SCHEDULE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-brand"
            >
              {t.update_on_github}
            </a>
            <span>
              {t.footer} &copy; {new Date().getFullYear()}
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
}

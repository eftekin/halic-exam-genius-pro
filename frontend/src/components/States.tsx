"use client";

import DayStrip from "@/components/DayStrip";
import { periodLabel } from "@/lib/exam";
import type { Lang, Translations } from "@/lib/i18n";

interface EmptyStateProps {
  days: string[];
  sessions: number;
  lang: Lang;
  t: Translations;
}

/** Shown when no courses are selected yet: the exam period, from the data. */
export function EmptyState({ days, sessions, lang, t }: EmptyStateProps) {
  if (days.length === 0) return null;
  const period = periodLabel(days, lang);

  return (
    <div className="flex flex-col gap-5 pt-3">
      <div className="flex flex-col gap-1">
        <p className="font-mono text-xs font-medium text-brand">
          {t.exam_period.toLocaleUpperCase(lang)}
        </p>
        <h2 className="text-[40px] font-semibold leading-tight">{period}</h2>
        <p className="font-mono text-[13px] text-muted">
          {t.period_summary(sessions, days.length)}
        </p>
      </div>
      <DayStrip
        days={days}
        marked={new Set()}
        label={`${t.exam_period}, ${period}`}
        lang={lang}
      />
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  t: Translations;
}

export function ErrorState({ message, onRetry, t }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-start gap-1 border border-danger p-3">
      <h2 className="text-sm font-semibold text-danger">{t.error_title}</h2>
      <p className="text-sm text-muted">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 min-h-11 rounded-[3px] bg-brand px-4 text-sm font-semibold text-on-brand"
        >
          {t.retry}
        </button>
      )}
    </div>
  );
}

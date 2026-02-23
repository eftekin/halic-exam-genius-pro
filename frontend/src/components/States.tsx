"use client";

import { BookOpen, AlertTriangle, RefreshCw } from "lucide-react";
import type { Translations } from "@/lib/i18n";

export function EmptyState({ t }: { t: Translations }) {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10">
        <BookOpen className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
      </div>
      <h3 className="mt-5 text-base font-semibold text-slate-800 dark:text-zinc-100">
        {t.empty_title}
      </h3>
      <p className="mt-1.5 max-w-[260px] text-sm leading-relaxed text-slate-500 dark:text-zinc-400">
        {t.empty_desc}
      </p>
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
    <div className="animate-fade-in flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10">
        <AlertTriangle className="h-6 w-6 text-red-500 dark:text-red-400" />
      </div>
      <h3 className="mt-5 text-base font-semibold text-slate-800 dark:text-zinc-100">
        {t.error_title}
      </h3>
      <p className="mt-1.5 max-w-[260px] text-sm text-slate-500 dark:text-zinc-400">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-50 px-5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
        >
          <RefreshCw className="h-4 w-4" />
          {t.retry}
        </button>
      )}
    </div>
  );
}

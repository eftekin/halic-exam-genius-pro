"use client";

import { BookOpen, AlertTriangle, RefreshCw } from "lucide-react";
import type { Translations } from "@/lib/i18n";

/** Placeholder shown when no courses are selected yet. */
export function EmptyState({ t }: { t: Translations }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
        <BookOpen className="h-6 w-6 text-zinc-500" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        {t.empty_title}
      </h3>
      <p className="mt-1 max-w-[260px] text-xs text-zinc-500 dark:text-zinc-400">
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

/** Error banner with optional retry button. */
export function ErrorState({ message, onRetry, t }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 dark:bg-red-500/10">
        <AlertTriangle className="h-6 w-6 text-red-500" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        {t.error_title}
      </h3>
      <p className="mt-1 max-w-[260px] text-xs text-zinc-500 dark:text-zinc-400">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400"
        >
          <RefreshCw className="h-4 w-4" />
          {t.retry}
        </button>
      )}
    </div>
  );
}

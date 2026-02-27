"use client";

import { BookOpen, AlertCircle, RotateCcw } from "lucide-react";
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
      <p className="mt-1 max-w-65 text-xs text-zinc-500 dark:text-zinc-400">
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

/** Premium error card with glassmorphism effect. */
export function ErrorState({ message, onRetry, t }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="relative w-full max-w-sm rounded-2xl border border-red-200/60 bg-linear-to-b from-red-50/80 to-white px-6 py-8 text-center shadow-[0_4px_24px_rgba(239,68,68,0.08)] backdrop-blur-sm dark:border-red-500/15 dark:from-red-500/5 dark:to-zinc-900/80 dark:shadow-[0_4px_24px_rgba(239,68,68,0.04)]">
        {/* Soft glow behind icon */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center">
          <div className="absolute h-14 w-14 rounded-full bg-red-400/20 blur-xl dark:bg-red-500/15" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10">
            <AlertCircle className="h-6 w-6 text-red-500 dark:text-red-400" />
          </div>
        </div>

        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          {t.error_title}
        </h2>
        <p className="mx-auto mt-2 max-w-70 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {message}
        </p>

        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-500/20 transition-all duration-200 hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/25 active:scale-[0.97] dark:bg-red-500/90 dark:shadow-red-500/10 dark:hover:bg-red-500"
          >
            <RotateCcw className="h-4 w-4" />
            {t.retry}
          </button>
        )}
      </div>
    </div>
  );
}

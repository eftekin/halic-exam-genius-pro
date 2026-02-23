"use client";

import { Download, Share2, CalendarPlus } from "lucide-react";
import { useState, type RefObject } from "react";
import { toPng } from "html-to-image";
import type { ExamDetail } from "@/lib/api";
import { generateMultiICS } from "@/lib/calendar";
import type { Translations } from "@/lib/i18n";

interface ExportBarProps {
  courseLabels: string[];
  exams: ExamDetail[];
  scheduleRef: RefObject<HTMLDivElement | null>;
  t: Translations;
  disabled?: boolean;
}

/** Detect if dark mode is active via the OS / Tailwind media query. */
function isDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

const BG_LIGHT = "#f8fafc"; // slate-50  (page background)
const BG_DARK = "#09090b"; // zinc-950 (page background)

async function captureScheduleImage(node: HTMLElement): Promise<Blob> {
  const bg = isDarkMode() ? BG_DARK : BG_LIGHT;

  // Temporarily apply an explicit background + padding so
  // html-to-image renders gaps between cards correctly.
  const prev = {
    bg: node.style.backgroundColor,
    padding: node.style.padding,
    borderRadius: node.style.borderRadius,
  };
  node.style.backgroundColor = bg;
  node.style.padding = "16px";
  node.style.borderRadius = "16px";

  try {
    const dataUrl = await toPng(node, {
      pixelRatio: 2,
      backgroundColor: bg,
      cacheBust: true,
    });
    const res = await fetch(dataUrl);
    return res.blob();
  } finally {
    // Restore original styles
    node.style.backgroundColor = prev.bg;
    node.style.padding = prev.padding;
    node.style.borderRadius = prev.borderRadius;
  }
}

export default function ExportBar({
  courseLabels,
  exams,
  scheduleRef,
  t,
  disabled = false,
}: ExportBarProps) {
  const [shareLoading, setShareLoading] = useState(false);
  const [icsLoading, setIcsLoading] = useState(false);

  /* ── ICS download ─────────────────────────────────────────────── */
  function handleICS() {
    if (exams.length === 0) return;
    setIcsLoading(true);
    try {
      const icsContent = generateMultiICS(exams, t);
      const blob = new Blob([icsContent], {
        type: "text/calendar;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sinav_programi.ics";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert(t.calendar_error);
    } finally {
      setIcsLoading(false);
    }
  }

  /* ── Share / Download PNG ─────────────────────────────────────── */
  async function handleShare() {
    if (!scheduleRef.current) return;
    setShareLoading(true);
    try {
      const blob = await captureScheduleImage(scheduleRef.current);
      const file = new File([blob], "exam_schedule.png", {
        type: "image/png",
      });

      if (
        typeof navigator.share === "function" &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          title: t.share_title,
          text: t.share_text,
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "exam_schedule.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      if ((err as DOMException)?.name !== "AbortError") {
        alert(t.share_error);
      }
    } finally {
      setShareLoading(false);
    }
  }

  const isDisabled = disabled || courseLabels.length === 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/60 shadow-[0_-1px_3px_rgba(0,0,0,0.04)] glass-panel dark:border-zinc-800/50">
      <div className="mx-auto flex max-w-lg items-center gap-2.5 px-4 pt-3 pb-safe">
        {/* Primary CTA — ICS */}
        <button
          onClick={handleICS}
          disabled={isDisabled || icsLoading}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all duration-150 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none dark:from-indigo-500 dark:to-violet-500 dark:shadow-indigo-500/10 dark:hover:shadow-indigo-500/20"
        >
          <CalendarPlus className="h-4 w-4" />
          {icsLoading ? t.generating : t.add_all_to_calendar(exams.length)}
        </button>

        {/* Secondary — Share / PNG */}
        <button
          onClick={handleShare}
          disabled={isDisabled || shareLoading}
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-sm transition-all duration-150 hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:pointer-events-none dark:border-zinc-700/50 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
          title={t.share_tooltip}
        >
          {shareLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 dark:border-zinc-600 dark:border-t-zinc-300" />
          ) : typeof navigator !== "undefined" &&
            typeof navigator.share === "function" ? (
            <Share2 className="h-4 w-4" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

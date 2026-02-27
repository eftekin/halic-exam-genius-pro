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

/** Capture the ExportView DOM node as a PNG blob using html-to-image. */
async function captureScheduleImage(node: HTMLElement): Promise<Blob> {
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
    // The source node is hidden with opacity:0. Override on the clone so
    // the rendered image is fully opaque — no flicker because the original
    // stays behind the page (z-index:-9999).
    style: { opacity: "1" },
  });
  const res = await fetch(dataUrl);
  return res.blob();
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

  if (isDisabled) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 pt-3 pb-safe">
        {/* ICS */}
        <button
          onClick={handleICS}
          disabled={isDisabled || icsLoading}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          <CalendarPlus className="h-4 w-4" />
          {icsLoading ? t.generating : t.add_all_to_calendar(exams.length)}
        </button>

        {/* PNG */}
        <button
          onClick={handleShare}
          disabled={isDisabled || shareLoading}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          title={t.share_tooltip}
        >
          {shareLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
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

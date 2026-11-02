"use client";

import { toPng } from "html-to-image";
import { CalendarPlus, Download, Share2 } from "lucide-react";
import { type RefObject, useState } from "react";
import type { Exam } from "@/lib/api";
import { generateMultiICS } from "@/lib/calendar";
import type { Translations } from "@/lib/i18n";

interface ExportBarProps {
  exams: Exam[];
  scheduleRef: RefObject<HTMLDivElement | null>;
  t: Translations;
  disabled?: boolean;
}

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

function saveFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportBar({
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
      saveFile(blob, t.ics_filename);
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
      const file = new File([blob], t.image_filename, { type: "image/png" });

      if (
        typeof navigator.share === "function" &&
        navigator.canShare?.({ files: [file] })
      ) {
        try {
          await navigator.share({
            title: t.share_title,
            text: t.share_text,
            files: [file],
          });
          return;
        } catch (err) {
          // Other rejections (Safari after a slow capture) fall back to a download.
          if ((err as DOMException)?.name === "AbortError") return;
        }
      }
      saveFile(blob, t.image_filename);
    } catch {
      alert(t.share_error);
    } finally {
      setShareLoading(false);
    }
  }

  const isDisabled = disabled || exams.length === 0;

  if (isDisabled) return null;

  const canShare = typeof navigator.share === "function";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-background">
      <div className="mx-auto flex max-w-2xl items-center gap-2 border-t-2 border-brand px-4 pt-2.5 pb-safe">
        <button
          type="button"
          onClick={handleICS}
          disabled={isDisabled || icsLoading}
          className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded-[3px] bg-brand text-[15px] font-semibold text-on-brand disabled:opacity-40"
        >
          <CalendarPlus className="h-4 w-4" />
          {icsLoading ? t.generating : t.add_all_to_calendar(exams.length)}
        </button>

        <button
          type="button"
          onClick={handleShare}
          disabled={isDisabled || shareLoading}
          className="flex h-[46px] shrink-0 items-center justify-center gap-2 rounded-[3px] border border-brand bg-background px-4 text-[15px] font-semibold text-brand disabled:opacity-40"
          title={t.share_tooltip}
        >
          {shareLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-bubble border-t-brand" />
          ) : canShare ? (
            <Share2 className="h-4 w-4" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {canShare ? t.share : t.download}
        </button>
      </div>
    </div>
  );
}

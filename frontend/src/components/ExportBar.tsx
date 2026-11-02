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

// Same rule as the `desktop` variant in globals.css, which picks the button label.
function isDesktop() {
  return window.matchMedia(
    "(hover: hover) and (pointer: fine) and (min-width: 768px)",
  ).matches;
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

      if (!isDesktop() && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            title: t.share_title,
            text: t.share_text,
            files: [file],
          });
          return;
        } catch (err) {
          // Any other rejection still gets the user the image.
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

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleICS}
        disabled={isDisabled || icsLoading}
        className="flex h-[46px] min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-[3px] bg-brand text-[15px] font-semibold text-on-brand disabled:opacity-40 max-[360px]:text-sm"
      >
        <CalendarPlus className="h-4 w-4 max-[360px]:hidden" />
        {icsLoading ? t.generating : t.add_all_to_calendar(exams.length)}
      </button>

      <button
        type="button"
        onClick={handleShare}
        disabled={isDisabled || shareLoading}
        className="flex h-[46px] shrink-0 items-center justify-center gap-2 rounded-[3px] border border-brand bg-background px-4 text-[15px] font-semibold text-brand disabled:opacity-40"
        title={t.share_tooltip}
      >
        {shareLoading && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-bubble border-t-brand" />
        )}
        <span className="inline-flex items-center gap-2 desktop:hidden">
          {!shareLoading && <Share2 className="h-4 w-4" />}
          {t.share}
        </span>
        <span className="hidden items-center gap-2 desktop:inline-flex">
          {!shareLoading && <Download className="h-4 w-4" />}
          {t.download}
        </span>
      </button>
    </div>
  );
}

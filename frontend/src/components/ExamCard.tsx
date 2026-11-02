"use client";

import { memo } from "react";
import type { Exam } from "@/lib/api";
import { sessionLabel } from "@/lib/exam";
import type { Translations } from "@/lib/i18n";

interface ExamCardProps {
  exam: Exam;
  t: Translations;
}

const ExamCard = memo(function ExamCard({ exam, t }: ExamCardProps) {
  const meta = [exam.code, sessionLabel(exam, t.section)].filter(Boolean);
  const rooms = exam.rooms.join(", ");

  return (
    <article className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-baseline gap-x-3 border-b border-border py-2.5 last:border-b-0 md:grid-cols-[7rem_minmax(0,1fr)_10.5rem] md:gap-x-4">
      <div className="font-mono text-sm font-semibold">
        {exam.start}
        <span className="block font-normal text-muted md:inline md:font-semibold md:text-foreground">
          <span className="hidden md:inline">-</span>
          {exam.end}
        </span>
      </div>

      <div className="min-w-0">
        <h3 className="text-[15.5px] font-semibold leading-tight md:text-base">
          {exam.name}
        </h3>
        <p className="mt-0.5 font-mono text-xs text-muted">
          {meta.join(" · ")}
          {rooms && (
            <span className="md:hidden">
              {" · "}
              {t.room} {rooms}
            </span>
          )}
        </p>
      </div>

      <div className="hidden font-mono text-[13px] md:block">{rooms}</div>
    </article>
  );
});

export default ExamCard;

import { dayOfMonth, weekdayShort } from "@/lib/exam";
import type { Lang } from "@/lib/i18n";

interface DayStripProps {
  days: string[];
  marked: Set<string>;
  label: string;
  lang: Lang;
}

/** Every exam day as a printed bubble row; days with a selected exam are solid. */
export default function DayStrip({ days, marked, label, lang }: DayStripProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className="grid grid-cols-[repeat(auto-fit,minmax(2rem,1fr))] gap-1 text-center font-mono"
    >
      {days.map((day) => {
        const isMarked = marked.has(day);
        return (
          <div key={day}>
            <div className="text-[10px] text-muted md:text-[11px]">
              {weekdayShort(day, lang)}
            </div>
            <div
              className={`text-xs md:text-[13px] ${isMarked ? "font-semibold" : "text-muted"}`}
            >
              {dayOfMonth(day)}
            </div>
            <span
              className={`mx-auto mt-[3px] block size-7 rounded-full md:mt-1 md:size-[34px] ${
                isMarked ? "bg-foreground" : "border border-bubble"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}

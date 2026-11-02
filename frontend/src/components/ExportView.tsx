"use client";

import { forwardRef } from "react";
import {
  ACADEMIC_YEAR,
  EXAM_TYPE_EN,
  EXAM_TYPE_TR,
  SEMESTER_EN,
  SEMESTER_TR,
} from "@/config/constants";
import type { Exam } from "@/lib/api";
import {
  dayLabel,
  dayOfMonth,
  examDays,
  groupByDay,
  sessionLabel,
  weekdayShort,
} from "@/lib/exam";
import type { Lang, Translations } from "@/lib/i18n";

const BLUE = "#001bc3";
const INK = "#14151a";
const MUTED = "#5b5e6b";
const RULE = "#dfe1ea";
const BUBBLE = "#a9afd6";
const SANS = "var(--font-plex-sans), Arial, sans-serif";
const MONO = "var(--font-plex-mono), 'Courier New', monospace";

// Off-screen PNG source for html-to-image; inline styles only, so the image
// looks the same at any screen width.
interface ExportViewProps {
  exams: Exam[];
  days: string[];
  t: Translations;
  lang: Lang;
}

function Logo() {
  const onDots = [
    [34, 34],
    [94, 34],
    [34, 64],
    [64, 64],
    [94, 64],
    [34, 94],
    [94, 94],
  ];
  return (
    <svg width="44" height="44" viewBox="0 0 128 128" aria-hidden="true">
      <rect width="128" height="128" rx="28" fill={BLUE} />
      {onDots.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="12" fill="#ffffff" />
      ))}
      <circle cx="64" cy="34" r="12" fill="#ffffff" fillOpacity="0.24" />
      <circle cx="64" cy="94" r="12" fill="#ffffff" fillOpacity="0.24" />
    </svg>
  );
}

const ExportView = forwardRef<HTMLDivElement, ExportViewProps>(
  function ExportView({ exams, days, t, lang }, ref) {
    const marked = new Set(examDays(exams));
    const term = `${ACADEMIC_YEAR} ${lang === "tr" ? SEMESTER_TR : SEMESTER_EN} · ${
      lang === "tr" ? EXAM_TYPE_TR : EXAM_TYPE_EN
    }`;

    return (
      <div
        ref={ref}
        aria-hidden="true"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: 540,
          boxSizing: "border-box",
          opacity: 0,
          pointerEvents: "none",
          zIndex: -9999,
          backgroundColor: "#ffffff",
          color: INK,
          fontFamily: SANS,
          padding: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Logo />
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.15 }}>
              Exam Genius
            </div>
            <div style={{ fontSize: 13, color: MUTED }}>{t.subtitle}</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 14,
            paddingBottom: 10,
            borderBottom: `2px solid ${BLUE}`,
            fontFamily: MONO,
            fontSize: 12.5,
            fontWeight: 500,
            color: BLUE,
          }}
        >
          <span>{term.toLocaleUpperCase(lang)}</span>
          <span>{t.exams_listed(exams.length)}</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(38px, 1fr))",
            gap: 4,
            marginTop: 14,
            fontFamily: MONO,
            textAlign: "center",
          }}
        >
          {days.map((day) => (
            <div key={day}>
              <div style={{ fontSize: 10.5, color: MUTED }}>
                {weekdayShort(day, lang)}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: marked.has(day) ? 600 : 400,
                  color: marked.has(day) ? INK : MUTED,
                }}
              >
                {dayOfMonth(day)}
              </div>
              <div
                style={{
                  boxSizing: "border-box",
                  width: 30,
                  height: 30,
                  margin: "4px auto 0",
                  borderRadius: "50%",
                  backgroundColor: marked.has(day) ? INK : "transparent",
                  border: marked.has(day) ? "none" : `1px solid ${BUBBLE}`,
                }}
              />
            </div>
          ))}
        </div>

        {groupByDay(exams).map((group) => (
          <div key={group.date} style={{ marginTop: 16 }}>
            <div
              style={{
                paddingBottom: 5,
                borderBottom: `1px solid ${INK}`,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {dayLabel(group.date, lang)}
            </div>
            {group.exams.map((exam, i) => (
              <div
                key={exam.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "100px minmax(0, 1fr)",
                  gap: 12,
                  padding: "9px 0",
                  borderBottom:
                    i < group.exams.length - 1 ? `1px solid ${RULE}` : "none",
                }}
              >
                <div
                  style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600 }}
                >
                  {exam.start}-{exam.end}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.25 }}
                  >
                    {exam.name}
                  </div>
                  <div
                    style={{
                      marginTop: 2,
                      fontFamily: MONO,
                      fontSize: 12,
                      color: MUTED,
                    }}
                  >
                    {[
                      exam.code,
                      sessionLabel(exam, t.section),
                      exam.rooms.length > 0 &&
                        `${t.room(exam.rooms.length)} ${exam.rooms.join(", ")}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            marginTop: 18,
            paddingTop: 10,
            borderTop: `2px solid ${BLUE}`,
            fontSize: 11.5,
            color: MUTED,
          }}
        >
          <span style={{ fontFamily: MONO, fontWeight: 500, color: BLUE }}>
            halicexamgenius.app
          </span>
          <span>{t.unofficial}</span>
        </div>
      </div>
    );
  },
);

export default ExportView;

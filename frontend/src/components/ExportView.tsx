"use client";

import { forwardRef } from "react";
import type { ExamDetail } from "@/lib/api";
import type { Translations } from "@/lib/i18n";
import {
  ACADEMIC_YEAR,
  SEMESTER_TR,
  SEMESTER_EN,
  EXAM_TYPE_TR,
  EXAM_TYPE_EN,
} from "@/config/constants";

/*
 * ExportView — The PNG source of truth.
 *
 * White background, black text, 1px solid black borders.
 * 100% inline styles — no Tailwind, no CSS classes.
 * Looks like an official document a student can download.
 *
 * Rendered off-screen at fixed left:-9999px.
 * html-to-image captures this node directly.
 */

interface ExportViewProps {
  exams: ExamDetail[];
  t: Translations;
  lang: string;
}

function getScheduleTitle(lang: string) {
  const semester = lang === "tr" ? SEMESTER_TR : SEMESTER_EN;
  const examType = lang === "tr" ? EXAM_TYPE_TR : EXAM_TYPE_EN;
  const suffix = lang === "tr" ? "Sınav Programı" : "Exam Schedule";
  return `${ACADEMIC_YEAR} ${semester} ${examType} ${suffix}`;
}

function parseExamDate(raw: string) {
  const parts = raw.split(" ");
  const date = parts[0] ?? "";
  const weekday = parts[1] ?? "";
  const time = parts.slice(2).join(" ");
  return { date, weekday, time };
}

const ExportView = forwardRef<HTMLDivElement, ExportViewProps>(
  function ExportView({ exams, t, lang }, ref) {
    const thStyle: React.CSSProperties = {
      padding: "8px 12px",
      textAlign: "left",
      fontWeight: 700,
      fontSize: 12,
      borderBottom: "2px solid #001BC3",
      backgroundColor: "#EEF0FB",
      color: "#001BC3",
    };

    const tdStyle: React.CSSProperties = {
      padding: "8px 12px",
      fontSize: 13,
      borderBottom: "1px solid #d4d4d4",
      color: "#000",
    };

    return (
      <div
        ref={ref}
        aria-hidden="true"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: 780,
          opacity: 0,
          pointerEvents: "none",
          zIndex: -9999,
          backgroundColor: "#ffffff",
          color: "#000000",
          fontFamily: "Arial, Helvetica, sans-serif",
          padding: 28,
        }}
      >
        {/* Header */}
        <div
          style={{
            borderBottom: "3px solid #001BC3",
            paddingBottom: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#001BC3",
              marginBottom: 4,
            }}
          >
            {getScheduleTitle(lang)}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>
            Exam Genius — {t.subtitle}
          </div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
            {t.exams_listed(exams.length)}
          </div>
        </div>

        {/* Table */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #d4d4d4",
          }}
        >
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 36 }}>#</th>
              <th style={thStyle}>{lang === "tr" ? "Ders" : "Course"}</th>
              <th style={thStyle}>{lang === "tr" ? "Tarih" : "Date"}</th>
              <th style={thStyle}>{lang === "tr" ? "Saat" : "Time"}</th>
              <th style={thStyle}>{lang === "tr" ? "Derslik" : "Room"}</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam, i) => {
              const { date, weekday, time } = parseExamDate(exam.exam_date);
              return (
                <tr
                  key={exam.course_name + i}
                  style={{
                    backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa",
                  }}
                >
                  <td style={tdStyle}>{i + 1}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>
                    {exam.course_name}
                  </td>
                  <td style={tdStyle}>
                    {date} {weekday}
                  </td>
                  <td style={tdStyle}>{time || "—"}</td>
                  <td style={tdStyle}>{exam.classrooms?.join(", ") || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer */}
        <div
          style={{
            marginTop: 14,
            textAlign: "center",
            fontSize: 11,
            color: "#001BC3",
          }}
        >
          {t.footer} © {new Date().getFullYear()}
        </div>
      </div>
    );
  },
);

export default ExportView;

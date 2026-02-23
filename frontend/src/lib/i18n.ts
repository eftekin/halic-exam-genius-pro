"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  EXAM_TYPE_TR,
  EXAM_TYPE_EN,
  UNIVERSITY_NAME_TR,
  UNIVERSITY_NAME_EN,
  ACADEMIC_YEAR,
  SEMESTER_TR,
  SEMESTER_EN,
} from "@/config/constants";

// ── Supported languages ──────────────────────────────────────────────────────

export type Lang = "tr" | "en";

// ── Translation dictionary ───────────────────────────────────────────────────

const translations = {
  tr: {
    // Header
    subtitle: `${UNIVERSITY_NAME_TR} Sınav Programı`,

    // CourseSelector
    search_placeholder: "Ders ara ve seç...",
    search_placeholder_open: "Ders kodu veya adı ile ara...",
    courses_selected: (n: number) => `${n} ders seçildi`,
    clear_all: "Tümünü Kaldır",
    enter_hint: (code: string) => `ile "${code}" seç/kaldır`,
    loading_courses: "Dersler yükleniyor...",
    no_results: "Sonuç bulunamadı",

    // Schedule
    exams_listed: (n: number) => `${n} sınav listelendi`,
    exam_type: EXAM_TYPE_TR,

    // ExportBar
    add_all_to_calendar: (n: number) => `Tümünü Takvime Ekle (${n})`,
    generating: "Oluşturuluyor...",
    calendar_error: "Takvim dosyası oluşturulamadı.",
    share_title: "Sınav Programım",
    share_text: "İşte sınav programım! Haliç Exam Genius ile oluşturuldu.",
    share_error: "Görsel oluşturulamadı.",
    share_tooltip: "Paylaş / PNG İndir",

    // States
    empty_title: "Sınav Programını Görüntüle",
    empty_desc:
      "Yukarıdaki arama kutusundan derslerini seç ve sınav programını anında oluştur.",
    error_title: "Bir Hata Oluştu",
    retry: "Tekrar Dene",
    courses_load_error: "Dersler yüklenemedi",
    schedule_load_error: "Program yüklenemedi",

    // Calendar ICS
    ics_summary: (course: string) => `${course} ${EXAM_TYPE_TR}`,
    ics_description: (course: string) =>
      `${UNIVERSITY_NAME_TR} — ${course} ${EXAM_TYPE_TR} (${ACADEMIC_YEAR} ${SEMESTER_TR})`,

    // Footer
    footer: `${UNIVERSITY_NAME_TR} Sınav Programı`,
  },

  en: {
    subtitle: `${UNIVERSITY_NAME_EN} Exam Schedule`,

    search_placeholder: "Search and select courses...",
    search_placeholder_open: "Search by course code or name...",
    courses_selected: (n: number) => `${n} courses selected`,
    clear_all: "Clear All",
    enter_hint: (code: string) => `to select/remove "${code}"`,
    loading_courses: "Loading courses...",
    no_results: "No results found",

    exams_listed: (n: number) => `${n} exams listed`,
    exam_type: EXAM_TYPE_EN,

    add_all_to_calendar: (n: number) => `Add All to Calendar (${n})`,
    generating: "Generating...",
    calendar_error: "Could not generate calendar file.",
    share_title: "My Exam Schedule",
    share_text: "Here's my exam schedule! Created with Haliç Exam Genius.",
    share_error: "Could not generate image.",
    share_tooltip: "Share / Download PNG",

    empty_title: "View Exam Schedule",
    empty_desc:
      "Select your courses from the search bar above to instantly generate your exam schedule.",
    error_title: "An Error Occurred",
    retry: "Retry",
    courses_load_error: "Could not load courses",
    schedule_load_error: "Could not load schedule",

    ics_summary: (course: string) => `${course} ${EXAM_TYPE_EN}`,
    ics_description: (course: string) =>
      `${UNIVERSITY_NAME_EN} — ${course} ${EXAM_TYPE_EN} (${ACADEMIC_YEAR} ${SEMESTER_EN})`,

    footer: `${UNIVERSITY_NAME_EN} Exam Schedule`,
  },
} as const;

export type Translations = {
  [K in keyof (typeof translations)["tr"]]: (typeof translations)["tr"][K] extends (
    ...args: infer A
  ) => infer R
    ? (...args: A) => R
    : string;
};

// ── Auto-detect helper ───────────────────────────────────────────────────────

function detectLang(): Lang {
  if (typeof navigator === "undefined") return "tr";
  const raw = navigator.language ?? navigator.languages?.[0] ?? "tr";
  // If the browser language starts with "tr", use Turkish; everything else → English
  return raw.toLowerCase().startsWith("tr") ? "tr" : "en";
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useLanguage() {
  const [lang, setLangState] = useState<Lang>("tr");

  useEffect(() => {
    setLangState(detectLang());
  }, []);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const t = useMemo(() => translations[lang], [lang]);

  return { lang, setLang, t } as const;
}

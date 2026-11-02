"use client";

/**
 * Internationalisation (i18n) module.
 *
 * Provides TR/EN translation dictionaries and the `useLanguage` hook
 * that auto-detects the browser locale on mount.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ACADEMIC_YEAR,
  EXAM_TYPE_EN,
  EXAM_TYPE_TR,
  SEMESTER_EN,
  SEMESTER_TR,
  SITE_URL,
  UNIVERSITY_NAME_EN,
  UNIVERSITY_NAME_TR,
} from "@/config/constants";

// ── Supported languages ──────────────────────────────────────────────────────

export type Lang = "tr" | "en";

// ── Translation dictionary ───────────────────────────────────────────────────

const translations = {
  tr: {
    // Header
    subtitle: `${UNIVERSITY_NAME_TR} Sınav Programı`,

    // CourseSelector
    courses_label: "Dersler",
    search_placeholder: "Ders ara ve seç",
    search_placeholder_open: "Ders kodu veya adı ile ara",
    remove_course: (course: string) => `${course} kaldır`,
    toggle_list: "Ders listesini aç veya kapat",
    clear_search: "Aramayı temizle",
    courses_selected: (n: number) => `${n} ders seçildi`,
    clear_all: "Tümünü Kaldır",
    enter_hint: (code: string) => `ile "${code}" seç/kaldır`,
    loading_courses: "Dersler yükleniyor...",
    no_results: "Sonuç bulunamadı",

    // Schedule
    exams_listed: (n: number) => `${n} sınav listelendi`,
    section: "Şube",
    room: (_n: number) => "Derslik",

    // ExportBar
    add_all_to_calendar: (n: number) => `Tümünü Takvime Ekle (${n})`,
    generating: "Oluşturuluyor...",
    calendar_error: "Takvim dosyası oluşturulamadı.",
    share: "Paylaş",
    download: "İndir",
    ics_filename: "sinav_programi.ics",
    image_filename: "sinav_programi.png",
    share_title: "Sınav Programım",
    share_text: `Sınav programım, Haliç Exam Genius ile hazırlandı: ${SITE_URL}`,
    share_error: "Görsel oluşturulamadı.",
    share_tooltip: "Görsel olarak paylaş veya indir",
    unofficial: "Üniversitenin resmi sitesi değildir",

    // States
    exam_period: `${EXAM_TYPE_TR} dönemi`,
    period_summary: (sessions: number, days: number) =>
      `${sessions.toLocaleString("tr-TR")} sınav oturumu · ${days} gün`,
    error_title: "Bir Sorun Oluştu",
    retry: "Tekrar Dene",
    courses_load_error: "Dersler yüklenemedi",

    // Calendar ICS
    ics_summary: (course: string) => `${course} ${EXAM_TYPE_TR}`,
    ics_description: (course: string) =>
      `${UNIVERSITY_NAME_TR} — ${course} ${EXAM_TYPE_TR} (${ACADEMIC_YEAR} ${SEMESTER_TR})`,

    // Footer
    footer: "Haliç Exam Genius",
    update_on_github: "Program güncel değil mi? GitHub'da güncelle",
    star_on_github: "GitHub'da yıldızla",
  },

  en: {
    subtitle: `${UNIVERSITY_NAME_EN} Exam Schedule`,

    courses_label: "Courses",
    search_placeholder: "Search and select courses",
    search_placeholder_open: "Search by course code or name",
    remove_course: (course: string) => `Remove ${course}`,
    toggle_list: "Open or close the course list",
    clear_search: "Clear search",
    courses_selected: (n: number) => `${n} courses selected`,
    clear_all: "Clear All",
    enter_hint: (code: string) => `to select/remove "${code}"`,
    loading_courses: "Loading courses...",
    no_results: "No results found",

    exams_listed: (n: number) => `${n} exams listed`,
    section: "Section",
    room: (n: number) => (n > 1 ? "Rooms" : "Room"),

    add_all_to_calendar: (n: number) => `Add All to Calendar (${n})`,
    generating: "Generating...",
    calendar_error: "Could not generate calendar file.",
    share: "Share",
    download: "Download",
    ics_filename: "exam_schedule.ics",
    image_filename: "exam_schedule.png",
    share_title: "My Exam Schedule",
    share_text: `My exam schedule, made with Haliç Exam Genius: ${SITE_URL}`,
    share_error: "Could not generate image.",
    share_tooltip: "Share or download as an image",
    unofficial: "Not an official university site",

    exam_period: `${EXAM_TYPE_EN} period`,
    period_summary: (sessions: number, days: number) =>
      `${sessions.toLocaleString("en-US")} exam ${sessions === 1 ? "session" : "sessions"} · ${days} ${days === 1 ? "day" : "days"}`,
    error_title: "Something Went Wrong",
    retry: "Retry",
    courses_load_error: "Could not load courses",

    ics_summary: (course: string) => `${course} ${EXAM_TYPE_EN}`,
    ics_description: (course: string) =>
      `${UNIVERSITY_NAME_EN} — ${course} ${EXAM_TYPE_EN} (${ACADEMIC_YEAR} ${SEMESTER_EN})`,

    footer: "Haliç Exam Genius",
    update_on_github: "Schedule out of date? Update it on GitHub",
    star_on_github: "Star on GitHub",
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

/** Detect the user's preferred language from the browser. */
function detectLang(): Lang {
  if (typeof navigator === "undefined") return "tr";
  const raw = navigator.language ?? navigator.languages?.[0] ?? "tr";
  return raw.toLowerCase().startsWith("tr") ? "tr" : "en";
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * React hook that provides the current language, a setter, and the
 * matching translation dictionary.
 */
export function useLanguage() {
  const [lang, setLangState] = useState<Lang>("tr");

  useEffect(() => {
    setLangState(detectLang());
  }, []);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const t = useMemo(() => translations[lang], [lang]);

  return { lang, setLang, t } as const;
}

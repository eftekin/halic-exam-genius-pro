// Run with TZ set far from Istanbul (CI uses America/Los_Angeles): a time zone bug
// would shift the weekday or the ICS hour here, and stays invisible on an Istanbul machine.
import assert from "node:assert/strict";
import test from "node:test";
import type { Exam } from "./api.ts";
import { generateMultiICS } from "./calendar.ts";
import { compareExams, formatDate, sessionLabel, weekday } from "./exam.ts";
import type { Translations } from "./i18n.ts";

const exam = (over: Partial<Exam> = {}): Exam => ({
  id: "AŞP1001-2025-11-14-09:00",
  code: "AŞP1001",
  name: "Beslenme İlkeleri",
  search_code: "asp1001",
  date: "2025-11-14",
  start: "09:00",
  end: "10:00",
  rooms: ["10327"],
  ...over,
});

test("date and weekday come from the calendar date, not the device time zone", () => {
  assert.equal(formatDate("2025-11-14"), "14/11/2025");
  assert.equal(weekday("2025-11-14", "tr"), "Cuma");
  assert.equal(weekday("2025-11-14", "en"), "Friday");
});

test("ics keeps the Excel time as Istanbul wall clock", () => {
  const t = {
    ics_summary: (c: string) => c,
    ics_description: (c: string) => c,
  } as unknown as Translations;
  const ics = generateMultiICS([exam()], t);
  assert.match(ics, /DTSTART;TZID=Europe\/Istanbul:20251114T090000\r\n/);
  assert.match(ics, /DTEND;TZID=Europe\/Istanbul:20251114T100000\r\n/);
  assert.match(ics, /UID:AŞP1001-2025-11-14-09:00@halic-exam-genius/);
});

test("session label shows section and program only when present", () => {
  assert.equal(sessionLabel(exam(), "Şube"), "");
  assert.equal(sessionLabel(exam({ section: "1" }), "Şube"), "Şube 1");
  assert.equal(
    sessionLabel(exam({ section: "1", program: "Aşçılık (İ.Ö)" }), "Şube"),
    "Şube 1 · Aşçılık (İ.Ö)",
  );
});

test("exams sort by date, then start time", () => {
  const sorted = [
    exam({ code: "B", date: "2025-11-15", start: "09:00" }),
    exam({ code: "C", date: "2025-11-14", start: "13:00" }),
    exam({ code: "A", date: "2025-11-14", start: "09:00" }),
  ].sort(compareExams);
  assert.deepEqual(
    sorted.map((e) => e.code),
    ["A", "C", "B"],
  );
});

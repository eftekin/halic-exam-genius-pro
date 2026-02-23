"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Search, X, ChevronDown, Check } from "lucide-react";
import type { Course } from "@/lib/api";
import type { Translations } from "@/lib/i18n";

/* ── Props ─────────────────────────────────────────────────────────── */
interface CourseSelectorProps {
  courses: Course[];
  selected: Course[];
  onChange: (courses: Course[]) => void;
  isLoading?: boolean;
  t: Translations;
}

/* ── Smart search helpers ──────────────────────────────────────────── */
function buildAcronym(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .toLowerCase();
}

function matchesCourse(course: Course, q: string): boolean {
  const lower = q.toLowerCase();
  if (
    course.label.toLowerCase().includes(lower) ||
    course.code.toLowerCase().includes(lower) ||
    course.name.toLowerCase().includes(lower)
  )
    return true;
  if (buildAcronym(course.name) === lower) return true;
  return course.name
    .toLowerCase()
    .split(/\s+/)
    .some((w) => w.startsWith(lower));
}

/* ── Component ─────────────────────────────────────────────────────── */
export default function CourseSelector({
  courses,
  selected,
  onChange,
  isLoading = false,
  t,
}: CourseSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* Close on outside click */
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const selectedLabels = useMemo(
    () => new Set(selected.map((c) => c.label)),
    [selected],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return courses;
    return courses.filter((c) => matchesCourse(c, query.trim()));
  }, [courses, query]);

  const toggle = useCallback(
    (course: Course) => {
      if (selectedLabels.has(course.label)) {
        onChange(selected.filter((c) => c.label !== course.label));
      } else {
        onChange([...selected, course]);
      }
    },
    [selected, selectedLabels, onChange],
  );

  const removeChip = useCallback(
    (label: string) => {
      onChange(selected.filter((c) => c.label !== label));
    },
    [selected, onChange],
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered.length > 0) {
        toggle(filtered[0]);
        setQuery("");
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* ── Trigger / Search input ───────────────────────────────── */}
      <div
        className={`flex w-full min-h-[48px] items-center gap-2 rounded-xl border bg-white px-3.5 py-2 transition-all duration-150 cursor-text dark:bg-zinc-900/60 ${
          open
            ? "border-indigo-400 ring-2 ring-indigo-500/20 shadow-md dark:border-indigo-400/50 dark:ring-indigo-500/10"
            : "border-slate-200 shadow-sm hover:border-slate-300 dark:border-zinc-700/50 dark:hover:border-zinc-600/50"
        }`}
        onClick={() => {
          if (!open) setOpen(true);
          inputRef.current?.focus();
        }}
      >
        <Search className="h-4 w-4 shrink-0 text-slate-400 dark:text-zinc-500" />

        {/* Chips when closed */}
        {!open && selected.length > 0 && selected.length <= 3 && (
          <div className="flex flex-wrap gap-1.5">
            {selected.map((c) => (
              <span
                key={c.label}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
              >
                {c.code.toUpperCase()}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeChip(c.label);
                  }}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {!open && selected.length > 3 && (
          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            {t.courses_selected(selected.length)}
          </span>
        )}

        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            if (!open) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            open
              ? t.search_placeholder_open
              : selected.length === 0
                ? t.search_placeholder
                : ""
          }
          className={`min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-zinc-100 dark:placeholder:text-zinc-500 ${
            !open && selected.length > 0 ? "w-0 flex-none" : ""
          }`}
          autoComplete="off"
          spellCheck={false}
        />

        {open && query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="shrink-0 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <ChevronDown
          className={`ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((prev) => !prev);
          }}
        />
      </div>

      {/* ── Dropdown ─────────────────────────────────────────────── */}
      {open && (
        <div className="animate-dropdown-in absolute left-0 top-full z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-zinc-700/50 dark:bg-zinc-900">
          {/* Selection toolbar */}
          {selected.length > 0 && (
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 dark:border-zinc-800">
              <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                {t.courses_selected(selected.length)}
              </span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs font-medium text-red-500 transition-colors hover:text-red-600 dark:text-red-400"
              >
                {t.clear_all}
              </button>
            </div>
          )}

          {/* Enter hint */}
          {query && filtered.length > 0 && (
            <div className="border-b border-slate-100 px-4 py-1.5 dark:border-zinc-800">
              <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] dark:bg-zinc-800">
                  Enter
                </kbd>{" "}
                {t.enter_hint(filtered[0].code.toUpperCase())}
              </span>
            </div>
          )}

          {/* Option list */}
          <ul className="max-h-60 overflow-y-auto overscroll-contain py-1">
            {isLoading && (
              <li className="flex flex-col items-center gap-2 px-4 py-8 text-sm text-slate-400">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 dark:border-indigo-800 dark:border-t-indigo-400" />
                <span>{t.loading_courses}</span>
              </li>
            )}

            {!isLoading && filtered.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-slate-400 dark:text-zinc-500">
                {t.no_results}
              </li>
            )}

            {!isLoading &&
              filtered.map((course, idx) => {
                const isSelected = selectedLabels.has(course.label);
                const isFirst = idx === 0 && query.trim().length > 0;
                return (
                  <li key={course.label}>
                    <button
                      type="button"
                      onClick={() => toggle(course)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors duration-100 ${
                        isSelected
                          ? "bg-indigo-50 dark:bg-indigo-500/10"
                          : isFirst
                            ? "bg-slate-50 dark:bg-zinc-800"
                            : "hover:bg-slate-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {/* Checkbox */}
                      <div
                        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border-[1.5px] transition-all duration-150 ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-500 text-white scale-105"
                            : "border-slate-300 bg-white dark:border-zinc-600 dark:bg-zinc-900"
                        }`}
                      >
                        {isSelected && (
                          <Check className="h-3 w-3" strokeWidth={3} />
                        )}
                      </div>

                      {/* Label */}
                      <div className="min-w-0 truncate">
                        <span className="font-semibold text-slate-800 dark:text-zinc-100">
                          {course.code.toUpperCase()}
                        </span>
                        <span className="ml-1.5 text-slate-500 dark:text-zinc-400">
                          {course.name}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
          </ul>
        </div>
      )}
    </div>
  );
}

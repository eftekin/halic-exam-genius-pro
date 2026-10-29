"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Exam } from "@/lib/api";
import { sessionLabel } from "@/lib/exam";
import type { Translations } from "@/lib/i18n";

interface CourseSelectorProps {
  exams: Exam[];
  selected: Exam[];
  onChange: React.Dispatch<React.SetStateAction<Exam[]>>;
  isLoading?: boolean;
  t: Translations;
}

function buildAcronym(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .toLowerCase();
}

function matchesCourse(course: Exam, q: string): boolean {
  const lower = q.toLowerCase();

  if (
    course.code.toLowerCase().includes(lower) ||
    course.search_code.toLowerCase().includes(lower) ||
    course.name.toLowerCase().includes(lower)
  )
    return true;

  if (buildAcronym(course.name) === lower) return true;

  const queryTokens = lower.split(/\s+/).filter(Boolean);
  if (queryTokens.length > 1) {
    const nameWords = course.name.toLowerCase().split(/\s+/);
    return queryTokens.every((token) =>
      nameWords.some((w) => w.startsWith(token)),
    );
  }

  return course.name
    .toLowerCase()
    .split(/\s+/)
    .some((w) => w.startsWith(lower));
}

export default function CourseSelector({
  exams: courses,
  selected,
  onChange,
  isLoading = false,
  t,
}: CourseSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const selectedIds = useMemo(
    () => new Set(selected.map((c) => c.id)),
    [selected],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return courses;
    return courses.filter((c) => matchesCourse(c, query.trim()));
  }, [courses, query]);

  const toggle = useCallback(
    (course: Exam) => {
      onChange((prev) => {
        const exists = prev.some((c) => c.id === course.id);
        return exists
          ? prev.filter((c) => c.id !== course.id)
          : [...prev, course];
      });

      setQuery("");
      // dismiss the mobile keyboard
      if ("ontouchstart" in window) {
        inputRef.current?.blur();
      }
    },
    [onChange],
  );

  const removeChip = useCallback(
    (id: string) => {
      onChange((prev) => prev.filter((c) => c.id !== id));
    },
    [onChange],
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered.length > 0) {
        toggle(filtered[0]);
      }
    } else if (e.key === "Backspace" && query === "" && selected.length > 0) {
      onChange((prev) => prev.slice(0, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: mouse-only shortcut, the input inside is keyboard-focusable */}
      <div
        className="flex min-h-11 w-full cursor-text items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
        onClick={() => {
          if (!open) setOpen(true);
          inputRef.current?.focus();
        }}
      >
        <Search className="h-4 w-4 shrink-0 text-zinc-400" />

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {selected.map((c) => (
            <span
              key={c.id}
              className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
            >
              {[c.code, sessionLabel(c, t.section)].filter(Boolean).join(" · ")}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeChip(c.id);
                }}
                className="ml-0.5 rounded-full p-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-500/25"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

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
              selected.length === 0
                ? open
                  ? t.search_placeholder_open
                  : t.search_placeholder
                : open
                  ? t.search_placeholder_open
                  : ""
            }
            className="min-w-20 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="shrink-0 rounded p-0.5 text-zinc-400"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-400 ${open ? "rotate-180" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((prev) => !prev);
          }}
        />
      </div>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {selected.length > 0 && (
            <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {t.courses_selected(selected.length)}
              </span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs font-medium text-red-500"
              >
                {t.clear_all}
              </button>
            </div>
          )}

          {query && filtered.length > 0 && (
            <div className="border-b border-zinc-100 px-3 py-1.5 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-400">
                <kbd className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] dark:bg-zinc-800">
                  Enter
                </kbd>{" "}
                {t.enter_hint(filtered[0].code.toUpperCase())}
              </span>
            </div>
          )}

          <ul className="max-h-60 overflow-y-auto py-1">
            {isLoading && (
              <li className="px-3 py-6 text-center text-sm text-zinc-400">
                {t.loading_courses}
              </li>
            )}

            {!isLoading && filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-zinc-400">
                {t.no_results}
              </li>
            )}

            {!isLoading &&
              filtered.map((course) => {
                const isSelected = selectedIds.has(course.id);
                const session = sessionLabel(course, t.section);
                return (
                  <li key={course.id}>
                    <button
                      type="button"
                      onClick={() => toggle(course)}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm ${
                        isSelected ? "bg-indigo-50 dark:bg-indigo-500/10" : ""
                      }`}
                    >
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-500 text-white"
                            : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900"
                        }`}
                      >
                        {isSelected && (
                          <Check className="h-3 w-3" strokeWidth={3} />
                        )}
                      </div>
                      <div className="min-w-0 truncate">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                          {course.code}
                        </span>
                        {session && (
                          <span className="ml-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                            {session}
                          </span>
                        )}
                        <span className="ml-1.5 text-zinc-500 dark:text-zinc-400">
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

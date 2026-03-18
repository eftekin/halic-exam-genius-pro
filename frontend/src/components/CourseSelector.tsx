"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Search, X, ChevronDown, Check } from "lucide-react";
import type { Course } from "@/lib/api";
import type { Translations } from "@/lib/i18n";

interface CourseSelectorProps {
  courses: Course[];
  selected: Course[];
  onChange: React.Dispatch<React.SetStateAction<Course[]>>;
  isLoading?: boolean;
  t: Translations;
}

/** Build a lowercase acronym from the first letter of each word. */
function buildAcronym(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .toLowerCase();
}

/** Check if a course matches the search query by label, code, name, acronym, or word prefixes. */
function matchesCourse(course: Course, q: string): boolean {
  const lower = q.toLowerCase();

  // Substring match on label, code, or full name
  if (
    course.label.toLowerCase().includes(lower) ||
    course.code.toLowerCase().includes(lower) ||
    course.name.toLowerCase().includes(lower)
  )
    return true;

  // Acronym match
  if (buildAcronym(course.name) === lower) return true;

  // Multi-word prefix match — each query word must prefix a word in the course name
  const queryTokens = lower.split(/\s+/).filter(Boolean);
  if (queryTokens.length > 1) {
    const nameWords = course.name.toLowerCase().split(/\s+/);
    return queryTokens.every((token) =>
      nameWords.some((w) => w.startsWith(token)),
    );
  }

  // Single-word prefix match
  return course.name
    .toLowerCase()
    .split(/\s+/)
    .some((w) => w.startsWith(lower));
}

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
      onChange((prev) => {
        const exists = prev.some((c) => c.label === course.label);
        return exists
          ? prev.filter((c) => c.label !== course.label)
          : [...prev, course];
      });

      // Clear search query after toggling so the placeholder reappears
      setQuery("");
      // Blur input on touch devices to dismiss the mobile keyboard
      if ("ontouchstart" in window) {
        inputRef.current?.blur();
      }
    },
    [onChange],
  );

  const removeChip = useCallback(
    (label: string) => {
      onChange((prev) => prev.filter((c) => c.label !== label));
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
      // Remove the last selected course when backspace is pressed on empty input
      onChange((prev) => prev.slice(0, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger — chip-aware input bar */}
      <div
        className="flex min-h-11 w-full cursor-text items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
        onClick={() => {
          if (!open) setOpen(true);
          inputRef.current?.focus();
        }}
      >
        <Search className="h-4 w-4 shrink-0 text-zinc-400" />

        {/* Chips + input in a wrapping row */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {selected.map((c) => (
            <span
              key={c.label}
              className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
            >
              {c.code.toUpperCase()}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeChip(c.label);
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

      {/* Dropdown — plain show/hide, no animation */}
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {/* Selected count + clear */}
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

          {/* Enter hint */}
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

          {/* Option list */}
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
                const isSelected = selectedLabels.has(course.label);
                return (
                  <li key={course.label}>
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
                          {course.code.toUpperCase()}
                        </span>
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

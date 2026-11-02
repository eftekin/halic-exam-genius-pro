"use client";

import { ChevronDown, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PencilBubble from "@/components/PencilBubble";
import type { Exam } from "@/lib/api";
import { matchesCourse, sessionLabel } from "@/lib/exam";
import type { Translations } from "@/lib/i18n";

interface CourseSelectorProps {
  exams: Exam[];
  selected: Exam[];
  onChange: React.Dispatch<React.SetStateAction<Exam[]>>;
  isLoading?: boolean;
  t: Translations;
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
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
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
      } else {
        inputRef.current?.focus();
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
      if (query.trim() && filtered.length > 0) {
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
    <div ref={containerRef} className="flex w-full flex-col gap-2">
      <label
        htmlFor="course-search"
        className="text-xs font-semibold md:text-[12.5px]"
      >
        {t.courses_label}
      </label>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 font-mono text-xs font-medium md:text-[12.5px]">
          {selected.map((c) => {
            const label = [c.code, sessionLabel(c, t.section)]
              .filter(Boolean)
              .join(" · ");
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => removeChip(c.id)}
                aria-label={t.remove_course(label)}
                className="inline-flex items-center gap-1 rounded-[3px] border border-brand bg-background px-[7px] py-[5px] text-brand"
              >
                {label}
                <X className="h-3 w-3" />
              </button>
            );
          })}
        </div>
      )}

      <div className="relative">
        <input
          id="course-search"
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onClick={() => {
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            if (!open) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={open ? t.search_placeholder_open : t.search_placeholder}
          className="h-11 w-full rounded-[3px] border border-foreground bg-background pl-3 pr-20 text-base font-medium outline-none placeholder:font-normal placeholder:text-muted focus:border-2 focus:border-brand focus:pl-[11px] md:text-[15px]"
          autoComplete="off"
          spellCheck={false}
        />

        <div className="absolute inset-y-0 right-0 flex items-center">
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t.clear_search}
              className="flex size-9 items-center justify-center text-muted"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={t.toggle_list}
            aria-expanded={open}
            className="flex size-9 items-center justify-center text-muted"
          >
            <ChevronDown className={`h-4 w-4 ${open ? "rotate-180" : ""}`} />
          </button>
        </div>

        {open && (
          <div className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-[3px] border border-foreground bg-background shadow-md">
            {selected.length > 0 && (
              <div className="flex items-center justify-between border-b border-foreground px-3 py-1">
                <span className="font-mono text-xs font-medium">
                  {t.courses_selected(selected.length)}
                </span>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="min-h-8 text-[13px] font-semibold text-danger"
                >
                  {t.clear_all}
                </button>
              </div>
            )}

            {query && filtered.length > 0 && (
              <div className="border-b border-border px-3 py-1.5 text-[11px] text-muted">
                <kbd className="font-mono font-medium">Enter</kbd>{" "}
                {t.enter_hint(filtered[0].code.toUpperCase())}
              </div>
            )}

            <ul className="max-h-[min(50dvh,24rem)] overflow-y-auto px-3">
              {isLoading && (
                <li className="py-6 text-center text-sm text-muted">
                  {t.loading_courses}
                </li>
              )}

              {!isLoading && filtered.length === 0 && (
                <li className="py-6 text-center text-sm text-muted">
                  {t.no_results}
                </li>
              )}

              {!isLoading &&
                filtered.map((course) => {
                  const isSelected = selectedIds.has(course.id);
                  return (
                    <li
                      key={course.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <button
                        type="button"
                        onClick={() => toggle(course)}
                        aria-pressed={isSelected}
                        className="flex min-h-[58px] w-full items-center gap-3 py-2 text-left"
                      >
                        <PencilBubble checked={isSelected} seed={course.id} />
                        <span className="min-w-0">
                          <span className="block text-[15px] font-semibold leading-tight">
                            {course.name}
                          </span>
                          <span
                            className={`mt-0.5 block font-mono text-xs ${isSelected ? "text-brand" : "text-muted"}`}
                          >
                            {[course.code, sessionLabel(course, t.section)]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

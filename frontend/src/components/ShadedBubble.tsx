import type { CSSProperties } from "react";

// Filled in by hand: each one leaves a gap or crosses the printed ring a little.
const SHAPES = [
  "M6 5C11 1 20 1 24 6C28 11 27 20 22 24C17 28 8 27 4 22C0 16 2 9 6 5Z",
  "M8 3C14 0 23 2 26 8C29 14 26 22 20 25C14 28 6 26 3 19C1 13 3 6 8 3Z",
  "M9 6C14 3 22 4 25 10C27 16 25 23 18 26C12 27 6 24 4 18C3 13 5 8 9 6Z",
];

interface ShadedBubbleProps {
  seed: number;
  className?: string;
  style?: CSSProperties;
}

export default function ShadedBubble({
  seed,
  className,
  style,
}: ShadedBubbleProps) {
  return (
    <svg
      viewBox="0 0 28 28"
      aria-hidden="true"
      className={className}
      style={{ overflow: "visible", ...style }}
    >
      <circle cx="14" cy="14" r="13.5" fill="none" stroke="#a9afd6" />
      <path d={SHAPES[seed % SHAPES.length]} fill="#14151a" />
    </svg>
  );
}

import { useId } from "react";

const SCRIBBLES = [
  [
    "M6 9L21 5L5 13L23 9L5 17L24 13L6 21L23 17L8 24L21 21L11 25",
    "M9 6L23 8L4 11L25 14L5 15L23 19L7 20L20 24",
  ],
  [
    "M7 7L22 7L4 12L24 11L4 16L24 15L6 20L23 19L9 24L20 23",
    "M5 9L24 8L6 14L25 17L7 18L21 23",
  ],
  [
    "M9 5L20 6L5 10L23 9L4 15L25 13L5 19L23 18L7 23L20 22L12 26",
    "M6 8L25 11L4 13L22 20L7 21L19 25",
  ],
];

interface PencilBubbleProps {
  checked: boolean;
  seed: string;
}

/** Optical form bubble; a checked one looks shaded in with a pencil. */
export default function PencilBubble({ checked, seed }: PencilBubbleProps) {
  const filterId = `pencil-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const index = [...seed].reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const [main, cross] = SCRIBBLES[index % SCRIBBLES.length];

  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 28 28"
      aria-hidden="true"
      className="shrink-0 overflow-visible"
    >
      <circle
        cx="14"
        cy="14"
        r="13"
        fill="none"
        stroke="#6d7396"
        strokeWidth="1.8"
      />
      {checked && (
        <>
          <filter
            id={filterId}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              seed={index % 20}
            />
            <feDisplacementMap in="SourceGraphic" scale="1.5" />
          </filter>
          <g
            filter={`url(#${filterId})`}
            fill="none"
            stroke="var(--pencil)"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={main} strokeWidth="3" opacity="0.88" />
            <path d={cross} strokeWidth="1.7" opacity="0.6" />
          </g>
        </>
      )}
    </svg>
  );
}

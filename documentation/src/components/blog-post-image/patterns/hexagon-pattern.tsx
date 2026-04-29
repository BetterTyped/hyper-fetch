import React, { useId, useMemo } from "react";
import { cn } from "@site/src/lib/utils";

interface HexagonPatternProps extends React.SVGProps<SVGSVGElement> {
  radius?: number;
  gap?: number;
  x?: number;
  y?: number;
  hexagons?: Array<[col: number, row: number]>;
  strokeDasharray?: string;
  className?: string;
}

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(" ");
}

export function HexagonPattern({
  radius = 40,
  gap = 0,
  x = -1,
  y = -1,
  hexagons,
  strokeDasharray = "0",
  className,
  ...props
}: HexagonPatternProps) {
  const id = useId();

  const w = Math.sqrt(3) * (radius + gap);
  const h = 2 * (radius + gap);
  const patternWidth = w;
  const patternHeight = h * 0.75;

  const highlightedSet = useMemo(() => {
    if (!hexagons) return new Set<string>();
    return new Set(hexagons.map(([c, r]) => `${c}-${r}`));
  }, [hexagons]);

  return (
    <svg
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 h-full w-full fill-none stroke-gray-400/30", className)}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={patternWidth}
          height={patternHeight}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <polygon
            points={hexPoints(patternWidth / 2, radius, radius)}
            strokeDasharray={strokeDasharray}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
      {hexagons?.map(([col, row]) => {
        const cx = col * patternWidth + (row % 2 === 1 ? patternWidth / 2 : 0) + patternWidth / 2;
        const cy = row * patternHeight + radius;
        return (
          <polygon
            key={`${col}-${row}`}
            points={hexPoints(cx, cy, radius)}
            fill="currentColor"
            className={highlightedSet.has(`${col}-${row}`) ? "fill-current" : ""}
          />
        );
      })}
    </svg>
  );
}

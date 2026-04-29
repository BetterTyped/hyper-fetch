import React, { useId } from "react";
import { cn } from "@site/src/lib/utils";

interface StripedPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  direction?: "left" | "right";
  className?: string;
}

export function StripedPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  direction = "left",
  className,
  ...props
}: StripedPatternProps) {
  const id = useId();

  const d = direction === "left"
    ? `M${width} 0L0 ${height}`
    : `M0 0L${width} ${height}`;

  return (
    <svg
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 h-full w-full stroke-gray-400/30", className)}
      {...props}
    >
      <defs>
        <pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
          <path d={d} fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

import React, { useCallback, useId, useRef, useState } from "react";
import { cn } from "@site/src/lib/utils";

interface InteractiveGridPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  squares?: [horizontal: number, vertical: number];
  className?: string;
  squaresClassName?: string;
}

export function InteractiveGridPattern({
  width = 40,
  height = 40,
  squares = [24, 24],
  className,
  squaresClassName,
  ...props
}: InteractiveGridPatternProps) {
  const id = useId();
  const [hoveredSquare, setHoveredSquare] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / width);
      const y = Math.floor((e.clientY - rect.top) / height);
      setHoveredSquare(`${x}-${y}`);
    },
    [width, height],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredSquare(null);
  }, []);

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      className={cn("pointer-events-auto absolute inset-0 h-full w-full fill-gray-400/30 stroke-gray-400/30", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <defs>
        <pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse">
          <path d={`M${width} 0H0V${height}`} fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
      {Array.from({ length: squares[0] * squares[1] }, (_, i) => {
        const x = i % squares[0];
        const y = Math.floor(i / squares[0]);
        const key = `${x}-${y}`;
        const isHovered = hoveredSquare === key;
        return (
          <rect
            key={key}
            x={x * width + 1}
            y={y * height + 1}
            width={width - 1}
            height={height - 1}
            fill="currentColor"
            strokeWidth="0"
            className={cn(
              "transition-all duration-100 ease-in-out",
              isHovered ? "fill-current opacity-60" : "opacity-0",
              squaresClassName,
            )}
          />
        );
      })}
    </svg>
  );
}

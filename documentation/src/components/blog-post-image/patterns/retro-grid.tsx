import React from "react";
import { cn } from "@site/src/lib/utils";

interface RetroGridProps extends React.HTMLAttributes<HTMLDivElement> {
  angle?: number;
  cellSize?: number;
  opacity?: number;
  className?: string;
}

export function RetroGrid({
  angle = 65,
  cellSize = 60,
  opacity = 0.5,
  className,
  ...props
}: RetroGridProps) {
  const gridStyle: React.CSSProperties = {
    "--grid-angle": `${angle}deg`,
    "--cell-size": `${cellSize}px`,
    "--grid-opacity": opacity,
  } as React.CSSProperties;

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 h-full w-full overflow-hidden [perspective:200px]", className)}
      style={gridStyle}
      {...props}
    >
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div
          className={cn(
            "animate-retro-grid",
            "[background-repeat:repeat] [background-size:var(--cell-size)_var(--cell-size)] [height:300vh] [inset:0%_0px] [margin-left:-50%] [transform-origin:100%_0_0] [width:600vw]",
            "[background-image:linear-gradient(to_right,rgba(107,114,128,0.3)_1px,transparent_0),linear-gradient(to_bottom,rgba(107,114,128,0.3)_1px,transparent_0)]",
          )}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent to-90%" />
    </div>
  );
}

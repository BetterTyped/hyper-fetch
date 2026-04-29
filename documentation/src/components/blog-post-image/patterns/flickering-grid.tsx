import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@site/src/lib/utils";

interface FlickeringGridProps extends React.HTMLAttributes<HTMLDivElement> {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  maxOpacity?: number;
  className?: string;
}

function toRGBA(color: string, opacity: number): string {
  if (color.startsWith("#")) {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
}

export function FlickeringGrid({
  squareSize = 4,
  gridGap = 6,
  flickerChance = 0.3,
  color = "rgb(107, 114, 128)",
  maxOpacity = 0.3,
  className,
  ...props
}: FlickeringGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const opacitiesRef = useRef<number[]>([]);

  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement, w: number, h: number) => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);

      const cols = Math.ceil(w / (squareSize + gridGap));
      const rows = Math.ceil(h / (squareSize + gridGap));
      const total = cols * rows;

      if (opacitiesRef.current.length !== total) {
        opacitiesRef.current = Array.from({ length: total }, () => Math.random() * maxOpacity);
      }
    },
    [squareSize, gridGap, maxOpacity],
  );

  const drawGrid = useCallback(
    (canvas: HTMLCanvasElement, w: number, h: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      const cols = Math.ceil(w / (squareSize + gridGap));
      const rows = Math.ceil(h / (squareSize + gridGap));

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const idx = i * rows + j;
          if (Math.random() < flickerChance) {
            opacitiesRef.current[idx] = Math.random() * maxOpacity;
          }
          ctx.fillStyle = toRGBA(color, opacitiesRef.current[idx]);
          ctx.fillRect(
            i * (squareSize + gridGap),
            j * (squareSize + gridGap),
            squareSize,
            squareSize,
          );
        }
      }
    },
    [squareSize, gridGap, flickerChance, color, maxOpacity],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    setupCanvas(canvas, dimensions.width, dimensions.height);

    let rafId: number;
    let lastTime = 0;
    const interval = 150;

    const animate = (time: number) => {
      if (time - lastTime >= interval) {
        lastTime = time;
        drawGrid(canvas, dimensions.width, dimensions.height);
      }
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [dimensions, setupCanvas, drawGrid]);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      {...props}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

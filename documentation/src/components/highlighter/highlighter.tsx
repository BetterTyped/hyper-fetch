/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useRef, useState, useEffect } from "react";
import MousePosition from "@site/src/hooks/use-mouse-position";

type HighlighterProps = {
  children: React.ReactNode;
  className?: string;
  refresh?: boolean;
};

const findNode = (node: HTMLElement, className: string): HTMLElement | null => {
  if (node.classList.contains(className)) {
    return node;
  }
  if (node.children) {
    const element = Array.from(node.children).find((item) => findNode(item as HTMLElement, className)) as HTMLElement;
    return element || null;
  }
  return null;
};

export const Highlighter = ({ children, className = "", refresh = false }: HighlighterProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosition = MousePosition();
  const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerSize = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const [boxes, setBoxes] = useState<Array<HTMLElement>>([]);

  useEffect(() => {
    if (containerRef.current) {
      setBoxes(
        Array.from(containerRef.current.children)
          .map((el) => findNode(el as HTMLElement, "highlighter-item") as HTMLElement)
          .filter(Boolean),
      );
    }
  }, []);

  useEffect(() => {
    initContainer();
    window.addEventListener("resize", initContainer);

    return () => {
      window.removeEventListener("resize", initContainer);
    };
  }, [setBoxes]);

  useEffect(() => {
    onMouseMove();
  }, [mousePosition]);

  useEffect(() => {
    initContainer();
  }, [refresh]);

  const initContainer = () => {
    if (containerRef.current) {
      containerSize.current.w = containerRef.current.offsetWidth;
      containerSize.current.h = containerRef.current.offsetHeight;
    }
  };

  const onMouseMove = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const { w, h } = containerSize.current;
      const x = mousePosition.x - rect.left;
      const y = mousePosition.y - rect.top;
      const inside = x < w && x > 0 && y < h && y > 0;
      if (inside) {
        mouse.current.x = x;
        mouse.current.y = y;
        boxes.forEach((box) => {
          const boxX = -(box.getBoundingClientRect().left - rect.left) + mouse.current.x;
          const boxY = -(box.getBoundingClientRect().top - rect.top) + mouse.current.y;
          box.style.setProperty("--mouse-x", `${boxX}px`);
          box.style.setProperty("--mouse-y", `${boxY}px`);
        });
      }
    }
  };

  return (
    <div className={className} ref={containerRef}>
      {children}
    </div>
  );
};

type HighlighterItemProps = {
  children: React.ReactNode;
  className?: string;
};

export function HighlighterItem({ children, className = "" }: HighlighterItemProps) {
  const colorsDark =
    "dark:border-0 dark:bg-slate-800/80 dark:before:bg-blue-500 dark:after:[background:_radial-gradient(250px_circle_at_var(--mouse-x)_var(--mouse-y),theme(colors.slate.400),transparent)]";
  const colorsLight =
    "bg-white/10 before:bg-blue-300 after:[background:_radial-gradient(250px_circle_at_var(--mouse-x)_var(--mouse-y),theme(colors.slate.200),transparent)]";
  return (
    <div
      className={`highlighter-item ${colorsLight} ${colorsDark} border relative h-full rounded-3xl p-px before:absolute before:w-96 before:h-96 before:-left-48 before:-top-48 before:rounded-full before:opacity-0 before:pointer-events-none before:transition-opacity before:duration-500 before:translate-x-[var(--mouse-x)] before:translate-y-[var(--mouse-y)] before:hover:opacity-20 before:z-30 before:blur-[100px] after:absolute after:inset-0 after:rounded-[inherit] after:opacity-0 after:transition-opacity after:duration-500 after:group-hover:opacity-100 after:z-10 overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

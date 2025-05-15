import { cn } from "@site/src/lib/utils";
import React, { useState, useRef } from "react";

interface ShowMoreProps {
  children: React.ReactNode;
  collapsedHeight?: number; // px
  buttonClassName?: string;
}

export const ShowMore: React.FC<ShowMoreProps> = ({ children, collapsedHeight = 300, buttonClassName = "" }) => {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative w-full">
      <div
        ref={contentRef}
        className={`relative transition-all transform-gpu duration-200 overflow-hidden ${
          expanded ? "max-h-[9999px]" : `max-h-[${collapsedHeight}px]`
        }`}
        style={!expanded ? { maxHeight: collapsedHeight } : {}}
      >
        {children}
        {/* Gradient overlay when collapsed */}
        {!expanded && (
          <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-[var(--background)]" />
        )}
      </div>
      {/* Show more/less button */}
      <div className={cn("flex justify-center mt-2 -translate-y-1/2", expanded && "translate-y-0")}>
        <button
          type="button"
          className={`px-4 py-1 rounded bg-zinc-700 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-200 hover:bg-zinc-600 dark:hover:bg-zinc-800 transition-colors transform-gpu text-sm font-medium shadow border border-zinc-800 ${buttonClassName}`}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      </div>
    </div>
  );
};

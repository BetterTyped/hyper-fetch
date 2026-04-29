import React from "react";
import { cn } from "@site/src/lib/utils";

interface TerminalWindowProps {
  file?: string;
  children?: React.ReactNode;
  className?: string;
}

export function TerminalWindow({ file, children, className }: TerminalWindowProps) {
  return (
    <div className={cn("relative w-full max-w-[640px] mx-auto", className)}>
      {/* Amber under-glow */}
      <div
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-8 bg-yellow-500/20 blur-2xl rounded-full"
        aria-hidden="true"
      />

      <div className="relative rounded-lg border border-white/10 bg-[#0d0d0d]/90 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/50">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-[#1a1a1a]/80">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <span className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>

          {file && (
            <div className="flex items-center gap-1.5 ml-3 px-3 py-0.5 rounded-md bg-white/5 text-xs text-zinc-400">
              <span>{file}</span>
              <span className="text-zinc-600 ml-1">&times;</span>
            </div>
          )}
        </div>

        {/* Content area - strip all Docusaurus code block chrome */}
        <div className="blogpost-terminal-content">{children}</div>
      </div>
    </div>
  );
}

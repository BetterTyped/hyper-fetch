import React from "react";

interface ProgressBarProps {
  progress: number;
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, color = "#38BDF8" }) => (
  <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mt-1">
    <div className="h-full rounded-full" style={{ width: `${progress}%`, background: color }} />
  </div>
);

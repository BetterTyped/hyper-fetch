import React from "react";
import { Pause, Play, Loader } from "lucide-react";
import { DocsCard } from "@site/src/components/ui/docs-card";

import { EventType } from "./events";

interface QueueEventProps {
  event: Extract<EventType, { type: "fetch-queue" | "submit-queue" }>;
}

const iconMap: Record<string, React.ReactNode> = {
  Running: <Play className="w-4 h-4 text-green-500" />,
  Paused: <Pause className="w-4 h-4 text-yellow-500" />,
  Stopped: <Pause className="w-4 h-4 text-yellow-500" />,
};

export const QueueEvent: React.FC<QueueEventProps> = ({ event }) => {
  const label = event.type === "fetch-queue" ? "Fetch Queue" : "Submit Queue";
  return (
    <DocsCard hover={false} className="w-full">
      <div className="flex items-center gap-2 px-4 py-2">
        <span className="flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 w-8 h-8">
          {iconMap[event.name] || <Loader className="w-4 h-4 text-blue-400 animate-spin" />}
        </span>
        <div className="flex flex-col">
          <span className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">{event.name}</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
        </div>
      </div>
    </DocsCard>
  );
};

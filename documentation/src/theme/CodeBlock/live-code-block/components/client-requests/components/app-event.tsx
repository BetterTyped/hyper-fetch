import React from "react";
import { Wifi, WifiOff, Eye, EyeOff } from "lucide-react";
import { DocsCard } from "@site/src/components/ui/docs-card";

import { EventType } from "./events";

interface AppEventProps {
  event: Extract<EventType, { type: "app" }>;
}

const iconMap: Record<string, React.ReactNode> = {
  Online: <Wifi className="w-4 h-4 text-green-500" />,
  Offline: <WifiOff className="w-4 h-4 text-red-500" />,
  "App window focused": <Eye className="w-4 h-4 text-blue-500" />,
  "App window blurred": <EyeOff className="w-4 h-4 text-zinc-400" />,
};

export const AppEvent: React.FC<AppEventProps> = ({ event }) => {
  return (
    <DocsCard hover={false}>
      <div className="flex items-center gap-4 py-2 px-4">
        <span className="flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 w-8 h-8">
          {iconMap[event.name] || <Wifi className="w-4 h-4 text-zinc-400" />}
        </span>
        <div className="flex flex-col">
          <span className="font-semibold text-base text-zinc-900 dark:text-zinc-100">{event.name}</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">App Event</span>
        </div>
      </div>
    </DocsCard>
  );
};

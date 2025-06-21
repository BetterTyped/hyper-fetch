import React from "react";
import { AlertCircle, CheckCircle, MessageCircle } from "lucide-react";
import { DocsCard } from "@site/src/components/ui/docs-card";
import { cn } from "@site/src/lib/utils";

interface MessageEventProps {
  name: string;
  message: string;
  type?: "default" | "success" | "error";
}

const iconMap = {
  default: MessageCircle,
  success: CheckCircle,
  error: AlertCircle,
};

const colorMap = {
  default: "text-blue-500",
  success: "text-green-500",
  error: "text-red-500",
};

export const MessageEvent: React.FC<MessageEventProps> = ({ name, message, type = "default" }) => {
  const Icon = iconMap[type];
  const color = colorMap[type];
  return (
    <DocsCard hover={false}>
      <div className="flex items-center gap-4 py-2 px-4">
        <span className="flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 w-8 h-8">
          <Icon className={cn("w-4 h-4", color)} />
        </span>
        <div className="flex flex-col">
          <span className="font-semibold text-base text-zinc-900 dark:text-zinc-100">{name}</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{message}</span>
        </div>
      </div>
    </DocsCard>
  );
};

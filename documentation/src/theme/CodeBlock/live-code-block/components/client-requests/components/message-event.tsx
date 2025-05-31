import React from "react";
import { MessageCircle } from "lucide-react";
import { DocsCard } from "@site/src/components/ui/docs-card";

interface MessageEventProps {
  name: string;
  message: string;
}

export const MessageEvent: React.FC<MessageEventProps> = ({ name, message }) => {
  return (
    <DocsCard hover={false}>
      <div className="flex items-center gap-4 py-2 px-4">
        <span className="flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 w-8 h-8">
          <MessageCircle className="w-4 h-4 text-blue-500" />
        </span>
        <div className="flex flex-col">
          <span className="font-semibold text-base text-zinc-900 dark:text-zinc-100">{name}</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{message}</span>
        </div>
      </div>
    </DocsCard>
  );
};

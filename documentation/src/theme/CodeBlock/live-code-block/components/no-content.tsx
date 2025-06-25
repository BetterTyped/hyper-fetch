import React from "react";
import { FileX2 } from "lucide-react";
import { cn } from "@site/src/lib/utils";

export const NoContent: React.FC<{ message?: string; className?: string }> = ({
  message = "No content available",
  className = "",
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 w-full h-full text-center", className)}>
      <span className="flex items-center justify-center min-w-16 min-h-16 rounded-full bg-zinc-700/60 mb-4 shadow-inner">
        <FileX2 className="w-8 h-8 text-zinc-400" aria-hidden="true" />
      </span>
      <h2 className="text-xl font-semibold text-zinc-200 mb-2">{message}</h2>
      <p className="text-zinc-400 text-base max-w-md mx-auto">
        There is currently no content to display. Please check back later or try a different action.
      </p>
    </div>
  );
};

import { forwardRef } from "react";
import { cn } from "@site/src/lib/utils";

export const Box = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
  ({ children, className }, ref) => {
    return (
      <div
        className={cn(
          "bg-[rgba(52,51,50,0.59)] group shadow-[0_-1px_#ffdbdf1f,0_0_0_1px_#ffffff0f,2px_4px_16px_0px_rgba(248,248,248,0.06)_inset] rounded-lg backdrop-blur-lg",
          className,
        )}
        ref={ref}
      >
        {children}
      </div>
    );
  },
);

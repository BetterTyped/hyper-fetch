import type { ResizableProps } from "re-resizable";
import { Resizable } from "re-resizable";

import { Button } from "./button";
import { cn } from "@/lib/utils";

const BorderHandle = () => {
  const baseClasses = "absolute z-100 shadow-cyan";

  return (
    <div
      className={cn(
        baseClasses,
        "h-full w-[1px] border-l ml-[5px]",
        "flex items-center justify-end group border-l transition-all duration-200",
        "[border-image:linear-gradient(to_bottom,theme(colors.zinc.900/.3),theme(colors.zinc.400/.2),theme(colors.zinc.900/.3))1]",
        "hover:[border-image:linear-gradient(to_bottom,theme(colors.zinc.900/.6),theme(colors.zinc.400/.6),theme(colors.zinc.900/.5))1]",
        "active:[border-image:linear-gradient(to_bottom,theme(colors.zinc.900/.6),theme(colors.zinc.400/.6),theme(colors.zinc.900/.5))1]",
      )}
    >
      <Button
        variant="secondary"
        size="icon"
        className="min-w-3 h-7 gap-1 p-0 flex flex-col bg-sidebar cursor-ew-resize group-hover:opacity-100 group-active:opacity-100 opacity-60 rounded-r-[0px] rounded-l-[4px] translate-x-[-1px]"
      >
        <span className="w-1.5 h-0.5 bg-zinc-300 dark:bg-zinc-400 rounded-full" />
        <span className="w-1.5 h-0.5 bg-zinc-300 dark:bg-zinc-400 rounded-full" />
        <span className="w-1.5 h-0.5 bg-zinc-300 dark:bg-zinc-400 rounded-full" />
      </Button>
    </div>
  );
};

/**
 * Details panel docked to the right edge of its page, resized by dragging its left border.
 */
export const ResizableSidebar = ({ className, children, ...props }: ResizableProps) => {
  return (
    <div className="absolute pointer-events-none z-10 inset-2 flex justify-end">
      <Resizable
        defaultSize={{ width: "400px", height: "100%" }}
        minHeight="100%"
        maxHeight="100%"
        maxWidth="100%"
        {...props}
        className={cn(
          "flex flex-col border-l border-r border-dark-400 pointer-events-auto",
          "bg-card rounded-lg",
          className,
        )}
        handleComponent={{ left: <BorderHandle /> }}
        handleWrapperClass="absolute h-full"
      >
        {children}
      </Resizable>
    </div>
  );
};

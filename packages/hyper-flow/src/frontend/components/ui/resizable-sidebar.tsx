import { createContext, useContext, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Resizable, ResizableProps } from "re-resizable";

import { Button } from "./button";

import { cn } from "@/lib/utils";

const getPositionClasses = (position: "top" | "left" | "right" | "bottom") => {
  return `absolute ${
    {
      top: "w-full",
      left: "h-full",
      right: "h-full",
      bottom: "w-full",
    }[position]
  }`;
};

const getOppositePosition = (position: "top" | "left" | "right" | "bottom") => {
  if (position === "top") return "bottom";
  if (position === "left") return "right";
  if (position === "right") return "left";
  return "top";
};

const positionClasses = {
  top: "h-[1px] w-full border-b mb-[5px]",
  left: "h-full w-[1px] border-r mr-[5px]",
  right: "h-full w-[1px] border-l ml-[5px]",
  bottom: "h-[1px] w-full border-t mt-[5px]",
};

const BorderHandle = ({ position }: { position: "top" | "left" | "right" | "bottom" }) => {
  const baseClasses = "absolute z-100 shadow-cyan";

  return (
    <div
      className={cn(
        baseClasses,
        positionClasses[position],
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

const sideClasses = {
  top: "justify-start",
  left: "justify-start",
  right: "justify-end",
  bottom: "justify-end",
};

const availableBreakpoints = [
  {
    name: "xs",
    breakpoint: 300,
  },
  {
    name: "sm",
    breakpoint: 500,
  },
  {
    name: "md",
    breakpoint: 800,
  },
  {
    name: "lg",
    breakpoint: 1000,
  },
  {
    name: "xl",
    breakpoint: 1200,
  },
].reverse();

const ResizableSidebarContext = createContext<{
  breakpoint: (typeof availableBreakpoints)[number];
}>({
  breakpoint: availableBreakpoints[0],
});

export const useResizableSidebar = () => {
  return useContext(ResizableSidebarContext);
};

export const ResizableSidebar = ({
  className,
  position,
  children,
  absolute = true,
  ...props
}: ResizableProps & {
  position: "top" | "left" | "right" | "bottom";
  absolute?: boolean;
}) => {
  const sidebarRef = useRef<Resizable>(null);

  const [breakpoint, setBreakpoint] = useState<(typeof availableBreakpoints)[number]>(availableBreakpoints[0]);

  const componentProps: ResizableProps = {
    defaultSize: {
      width: "400px",
      height: "100%",
    },
    minHeight: "100%",
    maxHeight: "100%",
    maxWidth: "100%",
    ...props,
    className: cn(
      "flex flex-col border-l border-r border-dark-400 pointer-events-auto",
      "bg-card rounded-lg",
      className,
    ),
    handleComponent: {
      [getOppositePosition(position)]: <BorderHandle position={position} />,
    },
    handleWrapperClass: getPositionClasses(position),
    onResize: (_, __, ref) => {
      const width = ref.clientWidth;
      const newBreakpoint = availableBreakpoints.find((b) => width >= b.breakpoint);
      if (newBreakpoint) {
        setBreakpoint(newBreakpoint);
      }
    },
  };

  const value = useMemo(() => ({ breakpoint }), [breakpoint]);

  useLayoutEffect(() => {
    if (sidebarRef.current) {
      const { width } = sidebarRef.current.size;
      const newBreakpoint = availableBreakpoints.find((b) => width >= b.breakpoint);
      if (newBreakpoint) {
        setBreakpoint(newBreakpoint);
      }
    }
  }, [sidebarRef]);

  if (absolute) {
    return (
      <ResizableSidebarContext.Provider value={value}>
        <div className={cn("absolute pointer-events-none z-10 inset-2 flex", sideClasses[position])}>
          <Resizable {...componentProps} ref={sidebarRef}>
            {children}
          </Resizable>
        </div>
      </ResizableSidebarContext.Provider>
    );
  }

  return (
    <ResizableSidebarContext.Provider value={value}>
      <Resizable {...componentProps} ref={sidebarRef}>
        {children}
      </Resizable>
    </ResizableSidebarContext.Provider>
  );
};

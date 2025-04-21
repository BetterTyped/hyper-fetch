import { Resizable, ResizableProps } from "re-resizable";

import { cn } from "frontend/lib/utils";
import { Button } from "./button";

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
        "flex items-center justify-end group border-l",
        "[border-image:linear-gradient(to_bottom,theme(colors.slate.900/.3),theme(colors.slate.400/.2),theme(colors.slate.900/.3))1]",
        "hover:[border-image:linear-gradient(to_bottom,theme(colors.slate.900/.6),theme(colors.slate.400/.6),theme(colors.slate.900/.5))1]",
        "active:[border-image:linear-gradient(to_bottom,theme(colors.slate.900/.6),theme(colors.slate.400/.6),theme(colors.slate.900/.5))1]",
      )}
    >
      <Button
        variant="secondary"
        size="icon"
        className="min-w-3 h-7 gap-1 p-0 flex flex-col bg-sidebar cursor-ew-resize group-hover:opacity-100 group-active:opacity-100 opacity-60 rounded-r-[0px] rounded-l-[4px] translate-x-[-1px]"
      >
        <span className="w-1.5 h-0.5 bg-gray-300 dark:bg-gray-400 rounded-full" />
        <span className="w-1.5 h-0.5 bg-gray-300 dark:bg-gray-400 rounded-full" />
        <span className="w-1.5 h-0.5 bg-gray-300 dark:bg-gray-400 rounded-full" />
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
      "flex flex-col bg-sidebar border-l border-r border-light-300 dark:border-dark-400 pointer-events-auto",
      className,
    ),
    handleComponent: {
      [getOppositePosition(position)]: <BorderHandle position={position} />,
    },
    handleClasses: {
      // [getOppositePosition(position)]:
      // "z-100 opacity-0 hover:opacity-100 focus:opacity-100 active:opacity-100 transition-opacity duration-200",
    },
    handleWrapperClass: getPositionClasses(position),
  };

  if (absolute) {
    return (
      <div className={cn("absolute pointer-events-none z-100 inset-0 flex", sideClasses[position])}>
        <Resizable {...componentProps}>{children}</Resizable>
      </div>
    );
  }

  return <Resizable {...componentProps}>{children}</Resizable>;
};

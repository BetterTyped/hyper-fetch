import { Resizable, ResizableProps } from "re-resizable";

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

const getOpositePosition = (position: "top" | "left" | "right" | "bottom") => {
  if (position === "top") return "bottom";
  if (position === "left") return "right";
  if (position === "right") return "left";
  return "top";
};

const BorderHandle = ({ position }: { position: "top" | "left" | "right" | "bottom" }) => {
  const baseClasses = "absolute z-100 shadow-cyan";
  const positionClasses = {
    top: "h-[1px] w-full border-b border-cyan-300 dark:border-cyan-400 mb-[5px]",
    left: "h-full w-[1px] border-r border-cyan-300 dark:border-cyan-400 mr-[5px]",
    right: "h-full w-[1px] border-l border-cyan-300 dark:border-cyan-400 ml-[5px]",
    bottom: "h-[1px] w-full border-t border-cyan-300 dark:border-cyan-400 mt-[5px]",
  };

  return <div className={`${baseClasses} ${positionClasses[position]}`} />;
};

export const ResizableSidebar = ({
  className,
  position,
  children,
  ...props
}: ResizableProps & { position: "top" | "left" | "right" | "bottom" }) => {
  return (
    <Resizable
      defaultSize={{
        width: "400px",
        height: "100%",
      }}
      minHeight="100%"
      maxHeight="100%"
      maxWidth="100%"
      {...props}
      className={`flex flex-col overflow-y-hidden bg-light-50 dark:bg-dark-600 border-l border-r border-light-300 dark:border-dark-400 ${className || ""}`}
      handleComponent={{
        [getOpositePosition(position)]: <BorderHandle position={position} />,
      }}
      handleClasses={{
        [getOpositePosition(position)]:
          "z-100 opacity-0 hover:opacity-100 focus:opacity-100 active:opacity-100 transition-opacity duration-200",
      }}
      handleWrapperClass={getPositionClasses(position)}
    >
      {children}
    </Resizable>
  );
};

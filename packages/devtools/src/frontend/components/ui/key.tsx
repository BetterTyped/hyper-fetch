import React from "react";
import { Atom, Boxes, CircleDotDashed } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const getKeyIcon = (type: KeyTypes) => {
  switch (type) {
    case "queue":
      return <Atom className="w-5 h-5 stroke-blue-300" />;
    case "cache":
      return <Boxes className="w-5 h-5 stroke-orange-300" />;
    case "abort":
      return <CircleDotDashed className="w-5 h-5 stroke-red-300" />;
    default:
      return null;
  }
};

export type KeyTypes = "queue" | "cache" | "abort";

export const Key = ({
  value,
  type,
  className,
  ...props
}: React.HTMLProps<HTMLButtonElement> & { value: string; type: KeyTypes }) => {
  return (
    <Tooltip>
      <TooltipTrigger
        {...props}
        className={`flex items-center gap-1 overflow-hidden bg-transparent border-none text-inherit p-0 max-w-full outline-none ${className ?? ""}`}
      >
        {getKeyIcon(type)}
        <span className="block max-w-full truncate whitespace-nowrap">{value}</span>
      </TooltipTrigger>
      <TooltipContent>This is {type}Key</TooltipContent>
    </Tooltip>
  );
};

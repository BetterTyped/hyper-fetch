import { cn } from "frontend/lib/utils";

export const jsonViewerStyles = {
  base: cn(
    // Base styles
    "group relative px-2.5",
    // All elements
    "[&_*]:!text-xs [&_*]:!font-mono",
    // Direct ul child
    "[&>ul]:!m-0",
    // All ul elements
    "[&_ul]:relative",
    // All label elements
    "[&_label]:min-h-[19px]",
    // ul > li
    "[&_ul>li]:-translate-x-2.5",
    // Expandable arrow down - ul > li > div > div
    `[&_ul>li>div>div]:!text-dark-200 [&_ul>li>div>div]:-translate-y-[1px] [&_ul>li>div>div]:translate-x-[3px] [&_ul>li>div>div]:scale-[0.7]`,
    // ul > li > div
    "[&_ul>li>div]:-ml-1.5",
    // Line under arrow - ul > li > div::after
    `[&_ul>li>div]:after:absolute [&_ul>li>div]:after:content-[''] [&_ul>li>div]:after:block [&_ul>li>div]:after:w-0.5 [&_ul>li>div]:after:top-[25px] [&_ul>li>div]:after:left-[-3px] [&_ul>li>div]:after:bottom-[5px] [&_ul>li>div]:after:bg-dark-500`,
    // li with children
    "[&_li:has(:nth-child(3))>ul]:!grid [&_li:has(:nth-child(3))>ul]:grid-cols-1 [&_li:has(:nth-child(3))>ul]:w-[calc(100%-0.675em)]",
    // li without children
    "[&_li:not(:has(:nth-child(3)))]:flex",
    // li without children span
    "[&_li:not(:has(:nth-child(3)))>span]:flex-1",
    // All elements box-sizing
    "[&_*]:box-border",
  ),

  value: cn(
    "inline-flex text-inherit relative bg-transparent",
    "p-[2px_4px] rounded text-xs w-full ml-0.5",
    "bg-dark-400",
  ),

  disabledValue: "!bg-transparent",

  input: cn(
    // Base styles
    "text-inherit bg-gray-200/10 border-0",
    "tracking-[0.3px] resize-vertical w-full rounded p-0",
    // Focus state
    "focus:outline-offset-2 focus:outline-2 focus:outline-amber-400",
    "disabled:bg-transparent",
  ),

  checkbox: cn(
    // Base styles
    "absolute m-0 left-1 top-1/2 -translate-y-1/2 rounded p-0",
    // Focus state
    "focus:outline-offset-2 focus:outline-2 focus:outline-amber-400",
  ),

  label: cn("relative whitespace-nowrap", "text-light-300"),

  copy: {
    wrapper: cn("relative w-4 h-4 bg-transparent border-0 p-0 ml-1", "[&_svg]:w-3 [&_svg]:h-3 [&_svg]:translate-y-0.5"),
    copied: cn("[&_svg.copied]:stroke-green-400"),
  },
};

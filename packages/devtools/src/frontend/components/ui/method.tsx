import { HttpMethods } from "@hyper-fetch/core";

import { cn } from "frontend/lib/utils";

type ColorValue = {
  fill: string;
  text: string;
  stroke: string;
  background: string;
};

// For other than http methods - getDoc, getDocs, etc.
const cachedColors = new Map<string, ColorValue>();
const usedColors = new Set<string>();

const colors: Record<string, ColorValue> = {
  slate: {
    fill: "fill-slate-400",
    text: "text-slate-400",
    stroke: "stroke-slate-400",
    background: "bg-slate-500",
  },
  gray: {
    fill: "fill-gray-400",
    text: "text-gray-400",
    stroke: "stroke-gray-400",
    background: "bg-gray-500",
  },
  zinc: {
    fill: "fill-zinc-400",
    text: "text-zinc-400",
    stroke: "stroke-zinc-400",
    background: "bg-zinc-500",
  },
  neutral: {
    fill: "fill-neutral-400",
    text: "text-neutral-400",
    stroke: "stroke-neutral-400",
    background: "bg-neutral-500",
  },
  stone: {
    fill: "fill-stone-400",
    text: "text-stone-400",
    stroke: "stroke-stone-400",
    background: "bg-stone-500",
  },
  red: {
    fill: "fill-red-400",
    text: "text-red-400",
    stroke: "stroke-red-400",
    background: "bg-red-500",
  },
  orange: {
    fill: "fill-orange-400",
    text: "text-orange-400",
    stroke: "stroke-orange-400",
    background: "bg-orange-500",
  },
  amber: {
    fill: "fill-amber-400",
    text: "text-amber-400",
    stroke: "stroke-amber-400",
    background: "bg-amber-500",
  },
  yellow: {
    fill: "fill-yellow-400",
    text: "text-yellow-400",
    stroke: "stroke-yellow-400",
    background: "bg-yellow-500",
  },
  lime: {
    fill: "fill-lime-400",
    text: "text-lime-400",
    stroke: "stroke-lime-400",
    background: "bg-lime-500",
  },
  green: {
    fill: "fill-green-400",
    text: "text-green-400",
    stroke: "stroke-green-400",
    background: "bg-green-500",
  },
  emerald: {
    fill: "fill-emerald-400",
    text: "text-emerald-400",
    stroke: "stroke-emerald-400",
    background: "bg-emerald-500",
  },
  teal: {
    fill: "fill-teal-400",
    text: "text-teal-400",
    stroke: "stroke-teal-400",
    background: "bg-teal-500",
  },
  cyan: {
    fill: "fill-cyan-400",
    text: "text-cyan-400",
    stroke: "stroke-cyan-400",
    background: "bg-cyan-500",
  },
  sky: {
    fill: "fill-sky-400",
    text: "text-sky-400",
    stroke: "stroke-sky-400",
    background: "bg-sky-500",
  },
  blue: {
    fill: "fill-blue-400",
    text: "text-blue-400",
    stroke: "stroke-blue-400",
    background: "bg-blue-500",
  },
  indigo: {
    fill: "fill-indigo-400",
    text: "text-indigo-400",
    stroke: "stroke-indigo-400",
    background: "bg-indigo-500",
  },
  violet: {
    fill: "fill-violet-400",
    text: "text-violet-400",
    stroke: "stroke-violet-400",
    background: "bg-violet-500",
  },
  purple: {
    fill: "fill-purple-400",
    text: "text-purple-400",
    stroke: "stroke-purple-400",
    background: "bg-purple-500",
  },
  fuchsia: {
    fill: "fill-fuchsia-400",
    text: "text-fuchsia-400",
    stroke: "stroke-fuchsia-400",
    background: "bg-fuchsia-500",
  },
  pink: {
    fill: "fill-pink-400",
    text: "text-pink-400",
    stroke: "stroke-pink-400",
    background: "bg-pink-500",
  },
  rose: {
    fill: "fill-rose-400",
    text: "text-rose-400",
    stroke: "stroke-rose-400",
    background: "bg-rose-500",
  },
} as const;

const httpColors = {
  [HttpMethods.GET]: colors.green,
  [HttpMethods.POST]: colors.blue,
  [HttpMethods.PATCH]: colors.yellow,
  [HttpMethods.PUT]: colors.purple,
  [HttpMethods.DELETE]: colors.red,
} as const;

/**
 * Cached colors for methods
 * @param method
 * @returns
 */
export const getMethodColor = (method: string): ColorValue => {
  if (httpColors[method as keyof typeof httpColors]) {
    return httpColors[method as keyof typeof httpColors];
  }

  if (cachedColors.has(method)) {
    return cachedColors.get(method) as ColorValue;
  }

  // pick random color and not used for http methods
  // if all colors are used, start again from the beginning
  if (usedColors.size === Object.keys(colors).length) {
    usedColors.clear();
  }

  const availableColors = Object.entries(colors).filter(([color]) => !usedColors.has(color));
  const [color, values] = availableColors[Math.floor(Math.random() * availableColors.length)];

  usedColors.add(color);
  cachedColors.set(method, values);

  return values;
};

export const Method = ({ method, className, ...props }: React.HTMLProps<HTMLDivElement> & { method: string }) => {
  const { text } = getMethodColor(method);

  return (
    <span {...props} className={cn("uppercase font-semibold text-xs", text, className)}>
      {method}
    </span>
  );
};

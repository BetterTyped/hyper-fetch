import { HttpMethods } from "@hyper-fetch/core";

const methodColors = {
  default: "text-cyan-400",
  [HttpMethods.GET]: "text-green-400",
  [HttpMethods.POST]: "text-yellow-400",
  [HttpMethods.PATCH]: "text-purple-400",
  [HttpMethods.PUT]: "text-pink-400",
  [HttpMethods.DELETE]: "text-red-400",
} as const;

export const Method = ({ method, className, ...props }: React.HTMLProps<HTMLDivElement> & { method: string }) => {
  const colorClass = methodColors[method as keyof typeof methodColors] || methodColors.default;

  return (
    <span {...props} className={`uppercase font-semibold text-xs ${colorClass} ${className || ""}`}>
      {method}
    </span>
  );
};

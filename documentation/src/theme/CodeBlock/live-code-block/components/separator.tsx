import { cn } from "@site/src/lib/utils";

export const Separator = ({ className }: { className?: string }) => {
  return <div className={cn("h-px bg-gray-200 my-4", className)} />;
};

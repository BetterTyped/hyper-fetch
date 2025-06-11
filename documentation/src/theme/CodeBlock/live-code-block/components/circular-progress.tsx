import { cn } from "@site/src/lib/utils";
import { Loader2 } from "lucide-react";
import React from "react";

export const CircularProgress = (props: React.HTMLProps<HTMLDivElement>) => (
  <div {...props} className={cn("flex items-center justify-center py-4", props?.className)}>
    <Loader2 className="animate-spin" />
  </div>
);

import { memo, useMemo } from "react";

import { Badge } from "./badge";

import { cn } from "@/lib/utils";

export const CurrentVersion = memo(({ className, ...props }: React.ComponentProps<typeof Badge>) => {
  const version = String(window.electron.getAppVersion());

  const name = useMemo(() => {
    if (version === "0.0.0") {
      return "Next";
    }
    return `v${version}`;
  }, [version]);

  return (
    <Badge variant="outline" {...props} className={cn("min-h-[26px]", className)}>
      {name}
    </Badge>
  );
});

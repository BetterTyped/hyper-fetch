import { memo, useMemo } from "react";

import { Badge } from "./badge";

import { cn } from "@/lib/utils";

export const CurrentVersion = memo(({ className, ...props }: React.ComponentProps<typeof Badge>) => {
  const version = String(window.electron.getAppVersion());

  const name = useMemo(() => {
    // 0.0.0 or 0.0.1 is a development version
    if (version.startsWith("0")) {
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

import { memo } from "react";

import { cn } from "@/lib/utils";
import { Badge } from "./badge";

export const CurrentVersion = memo(({ className, ...props }: React.ComponentProps<typeof Badge>) => {
  const version = String(window.electron.getAppVersion());
  return (
    <Badge variant="outline" {...props} className={cn("min-h-[26px]", className)}>
      v{version}
    </Badge>
  );
});

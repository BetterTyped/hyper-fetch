import { Outlet } from "@tanstack/react-router";

import { Navbar } from "./navbar/navbar";
import { useIsFocused } from "@/hooks/use-is-focused";
import { cn } from "@/lib/utils";
import { ServerCrashDialog } from "./server-crash-dialog/server-crash-dialog";

export const App = () => {
  const isFocused = useIsFocused();

  return (
    <div className={cn("h-full w-full flex flex-col")}>
      <div
        className={cn(
          "relative h-full w-full flex flex-col min-w-[800px] min-h-[600px] rounded-lg border-[1px] border-zinc-700",
          {
            "brightness-90": !isFocused,
          },
        )}
      >
        <ServerCrashDialog />
        <Navbar />
        <div className="flex-1 flex flex-col">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

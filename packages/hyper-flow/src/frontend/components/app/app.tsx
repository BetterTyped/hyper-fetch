import { Outlet } from "@tanstack/react-router";
// import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { Navbar } from "./navbar/navbar";
import { ServerCrashDialog } from "./server-crash-dialog/server-crash-dialog";

import { useIsFocused } from "@/hooks/use-is-focused";
import { cn } from "@/lib/utils";

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
      {/* <TanStackRouterDevtools position="bottom-right" /> */}
    </div>
  );
};

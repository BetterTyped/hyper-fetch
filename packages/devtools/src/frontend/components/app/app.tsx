import { Outlet } from "@reins/router";

import { Navbar } from "./navbar/navbar";
import { useIsFocused } from "frontend/hooks/use-is-focused";
import { cn } from "frontend/lib/utils";
import { Crash } from "./crash/crash";
import { Providers } from "./providers/providers";

export const App = () => {
  const isFocused = useIsFocused();

  return (
    <Providers>
      <div className={cn("h-full w-full flex flex-col")}>
        <div
          className={cn(
            "relative h-full w-full flex flex-col min-w-[800px] min-h-[600px] rounded-lg border-[1px] border-gray-700",
            {
              "brightness-90": !isFocused,
            },
          )}
        >
          <Crash />
          <Navbar />
          <div className="flex-1 flex flex-col">
            <Outlet />
          </div>
        </div>
      </div>
    </Providers>
  );
};

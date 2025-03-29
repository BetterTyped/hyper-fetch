import { Outlet } from "@reins/router";

import { Navbar } from "./navbar/navbar";
import { useIsFocused } from "frontend/hooks/use-is-focused";
import { cn } from "frontend/lib/utils";

export const App = () => {
  const isFocused = useIsFocused();

  return (
    <div
      className={cn("h-full w-full flex flex-col relative", {
        "brightness-90 opacity-90": !isFocused,
      })}
    >
      <Navbar />
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
};

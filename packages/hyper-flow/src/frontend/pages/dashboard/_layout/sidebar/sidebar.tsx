import * as React from "react";

import { NavPrimary } from "./components/nav-primary";
import { NavTertiary } from "./components/nav-tertiary";

import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { CurrentVersion } from "@/components/ui/current-version";
import icon from "@/assets/images/icon.png";

export function DashboardSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <SidebarProvider className="min-h-full w-full">
      <Sidebar variant="inset" {...props} collapsible="none" className="h-full rounded-xl pl-2 w-full">
        <SidebarHeader>
          <div className="flex items-center gap-1 pt-5 pb-0 pr-3">
            <img src={icon} alt="" className="h-9 w-9 ml-1" />
            <div className="text-xl tracking-wide">
              <span className="font-bold mr-1">Hyper</span>
              <span
                className={cn(
                  "font-light text-zinc-400",
                  "bg-clip-text !text-transparent bg-gradient-to-tr from-zinc-400/70 via-zinc-400/90 to-zinc-400/80",
                )}
              >
                Flow
              </span>
            </div>
            <CurrentVersion className="ml-auto" />
          </div>
        </SidebarHeader>
        <SidebarContent className="mb-2">
          <NavPrimary />
          {/* <NavSecondary items={secondary} /> */}
          <NavTertiary className="mt-auto" />
        </SidebarContent>
        {/* <SidebarFooter>
          <NavOrg />
        </SidebarFooter> */}
      </Sidebar>
    </SidebarProvider>
  );
}

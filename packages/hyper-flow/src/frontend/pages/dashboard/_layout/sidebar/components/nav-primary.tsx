import type { LinkProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, AppWindow, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSettings } from "@/store/general/settings.store";

const items: ({
  title: string;
  icon: LucideIcon;
  onCrash?: boolean;
} & Pick<LinkProps, "to" | "params">)[] = [
  {
    title: "Applications",
    to: "/",
    icon: AppWindow,
  },
  {
    title: "Settings",
    to: "/settings",
    icon: Settings,
    onCrash: true,
  },
];

export function NavPrimary() {
  const serverStatus = useSettings((state) => state.serverStatus);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild tooltip={item.title}>
              <Link
                to={item.to}
                params={item.params}
                className="h-10 px-3 opacity-60 !py-2"
                activeOptions={{ exact: true }}
                activeProps={{ className: "bg-zinc-400/10 opacity-100" }}
              >
                <item.icon className="!size-5" />
                <span className="text-[14px] ml-1">{item.title}</span>
                {item.onCrash && serverStatus === "crashed" && (
                  <div className="ml-auto text-xs font-medium px-2 py-0.5 rounded-md animate-pulse flex items-center gap-1 pl-2">
                    <AlertTriangle className="h-3 w-3" />
                    Fix server
                  </div>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

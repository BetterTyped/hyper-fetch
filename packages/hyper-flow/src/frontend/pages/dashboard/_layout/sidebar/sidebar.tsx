import * as React from "react";
import { LinkProps } from "@tanstack/react-router";
import { LifeBuoy, LucideIcon, Send, Settings, FolderCode } from "lucide-react";

import { NavPrimary } from "./components/nav-primary";
import { NavTertiary } from "./components/nav-tertiary";

import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { CurrentVersion } from "@/components/ui/current-version";
import icon from "@/assets/images/icon.png";

const primary: Array<
  {
    title: string;
    icon: LucideIcon;
    isActive?: boolean;
    onCrash?: boolean;
    items?: Array<
      {
        title: string;
      } & Pick<LinkProps, "to" | "params">
    >;
  } & Pick<LinkProps, "to" | "params">
> = [
  // {
  //   title: "Workspaces",
  //   link: "dashboard",
  //   icon: FolderKanban,
  //   isActive: true,
  // },
  {
    title: "Applications",
    to: "/",
    icon: FolderCode,
  },
  // {
  //   title: "Members",
  //   link: "dashboard.members",
  //   icon: Users,
  // },
  {
    title: "Settings",
    to: "/settings",
    icon: Settings,
    onCrash: true,
  },
];

// const secondary: Array<{
//   name: string;
//   link: RoutingLocations;
//   icon: LucideIcon;
// }> = [
//   {
//     name: "Activities",
//     link: "dashboard.activities",
//     icon: MousePointerClick,
//   },
//   {
//     name: "My Favorites",
//     link: "dashboard.favorites",
//     icon: Star,
//   },
//   {
//     name: "Recently visited",
//     link: "dashboard.recentlyVisited",
//     icon: Clock,
//   },
// ];

const tertiary: Array<{
  name: string;
  link: string;
  icon: LucideIcon;
}> = [
  {
    name: "Support",
    link: "https://github.com/BetterTyped/hyper-fetch/issues",
    icon: LifeBuoy,
  },
  {
    name: "Feedback",
    link: "https://github.com/BetterTyped/hyper-fetch/discussions",
    icon: Send,
  },
];

export function DashboardSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // const user = {
  //   name: "shadcn",
  //   email: "m@example.com",
  //   avatar: "/avatars/shadcn.jpg",
  // };

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
          <NavPrimary items={primary} />
          {/* <NavSecondary items={secondary} /> */}
          <NavTertiary items={tertiary} className="mt-auto" />
        </SidebarContent>
        {/* <SidebarFooter>
          <NavOrg user={user} />
        </SidebarFooter> */}
      </Sidebar>
    </SidebarProvider>
  );
}

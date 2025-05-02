import * as React from "react";
import { LifeBuoy, LucideIcon, Send, Settings, FolderCode } from "lucide-react";

import { NavPrimary } from "./_components/nav-primary";
// import { NavSecondary } from "./_components/nav-secondary";
import { NavTertiary } from "./_components/nav-tertiary";
// import { NavOrg } from "./_components/nav-org";
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider } from "frontend/components/ui/sidebar";
import { RoutingLocations } from "frontend/routing/router";
import { cn } from "frontend/lib/utils";
import icon from "frontend/assets/images/icon.png";
import { CurrentVersion } from "frontend/components/ui/current-version";

const primary: Array<{
  title: string;
  link: RoutingLocations;
  icon: LucideIcon;
  isActive?: boolean;
  onCrash?: boolean;
  items?: Array<{
    title: string;
    link: RoutingLocations;
  }>;
}> = [
  // {
  //   title: "Workspaces",
  //   link: "dashboard",
  //   icon: FolderKanban,
  //   isActive: true,
  // },
  {
    title: "Projects",
    link: "dashboard",
    icon: FolderCode,
  },
  // {
  //   title: "Members",
  //   link: "dashboard.members",
  //   icon: Users,
  // },
  {
    title: "Settings",
    link: "dashboard.settings",
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
                  "font-light text-gray-400",
                  "bg-clip-text !text-transparent bg-gradient-to-tr from-gray-400/70 via-gray-400/90 to-gray-400/80",
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

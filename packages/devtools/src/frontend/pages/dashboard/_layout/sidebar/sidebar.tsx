import * as React from "react";
import { LifeBuoy, LucideIcon, Send, Settings, AudioLines } from "lucide-react";

import { NavPrimary } from "./_components/nav-primary";
// import { NavSecondary } from "./_components/nav-secondary";
import { NavTertiary } from "./_components/nav-tertiary";
// import { NavOrg } from "./_components/nav-org";
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider } from "frontend/components/ui/sidebar";
import Logo from "../../../../assets/images/logo.svg?react";
import { RoutingLocations } from "frontend/routing/router";

const primary: Array<{
  title: string;
  link: RoutingLocations;
  icon: LucideIcon;
  isActive?: boolean;
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
    icon: AudioLines,
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
    <SidebarProvider className="min-h-full">
      <Sidebar variant="inset" {...props} collapsible="none" className="h-full rounded-xl pl-2">
        <SidebarHeader>
          <div className="flex items-center gap-1 pt-3">
            <Logo className="h-8 w-8" />
            <span className="text-lg font-bold">HyperFetch</span>
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

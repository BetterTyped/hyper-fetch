import * as React from "react";
import {
  BookOpen,
  Bot,
  Frame,
  LifeBuoy,
  LucideIcon,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
} from "lucide-react";

import { NavPrimary } from "./_components/nav-primary";
import { NavSecondary } from "./_components/nav-secondary";
import { NavTertiary } from "./_components/nav-tertiary";
import { NavUser } from "./_components/nav-user";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarProvider } from "frontend/components/ui/sidebar";
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
  {
    title: "Projects",
    link: "dashboard.projects",
    icon: SquareTerminal,
    isActive: true,
  },
  {
    title: "Resources",
    link: "dashboard.resources",
    icon: Bot,
  },
  {
    title: "Members",
    link: "dashboard.members",
    icon: BookOpen,
  },
  {
    title: "Settings",
    link: "dashboard.settings",
    icon: Settings2,
  },
];

const secondary: Array<{
  name: string;
  link: RoutingLocations;
  icon: LucideIcon;
}> = [
  {
    name: "Activities",
    link: "dashboard.activities",
    icon: Frame,
  },
  {
    name: "My Favorites",
    link: "dashboard.favorites",
    icon: PieChart,
  },
  {
    name: "Recently visited",
    link: "dashboard.recentlyVisited",
    icon: Map,
  },
];

const tertiary: Array<{
  name: string;
  link: string;
  icon: LucideIcon;
}> = [
  {
    name: "Support",
    link: "https://support.hyperfetch.dev",
    icon: LifeBuoy,
  },
  {
    name: "Feedback",
    link: "https://feedback.hyperfetch.dev",
    icon: Send,
  },
];

export function DashboardSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  };

  return (
    <SidebarProvider className="min-h-full">
      <Sidebar variant="inset" {...props} collapsible="none" className="h-full rounded-xl pl-2">
        <SidebarHeader>
          <div className="flex items-center gap-1 pt-3">
            <Logo className="h-8 w-8" />
            <span className="text-lg font-bold">HyperFetch</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <NavPrimary items={primary} />
          <NavSecondary items={secondary} />
          <NavTertiary items={tertiary} className="mt-auto" />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}

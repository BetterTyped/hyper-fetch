"use client";

import * as React from "react";
import { ArchiveX, Command, File, Inbox, LucideIcon, Send, Settings2 } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "frontend/components/ui/sidebar";
import { Link, RoutingLocations } from "frontend/routing/router";
import { useWorkspaces } from "frontend/context/devtools.context";

const navigation: { title: string; url: RoutingLocations; icon: LucideIcon; isActive: boolean }[] = [
  {
    title: "Workspace",
    url: "project.workspace",
    icon: Inbox,
    isActive: true,
  },
  {
    title: "Network",
    url: "project.network",
    icon: File,
    isActive: false,
  },
  {
    title: "Cache",
    url: "project.cache",
    icon: Send,
    isActive: false,
  },
  {
    title: "Queues",
    url: "project.queues",
    icon: ArchiveX,
    isActive: false,
  },
  {
    title: "Settings",
    url: "project.settings",
    icon: Settings2,
    isActive: false,
  },
];

export function ProjectSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { activeWorkspace, workspaces } = useWorkspaces("project");

  const workspace = workspaces[activeWorkspace!];
  const { client } = workspace;

  return (
    <SidebarProvider>
      <Sidebar
        variant="inset"
        collapsible="none"
        className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row rounded-xl"
        {...props}
      >
        {/* This is the first sidebar */}
        {/* We disable collapsible and adjust width to icon. */}
        {/* This will make the sidebar appear as icons. */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <a href="#">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-yellow-500 text-sidebar-primary-foreground">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{workspace.name}</span>
                    <span className="truncate text-xs">{client.adapter.name}</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>{/* <NavUser user={data.user} /> */}</SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}

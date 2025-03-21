"use client";

import * as React from "react";
import { ArchiveX, Atom, Boxes, Earth, File, Home, Inbox, LucideIcon, Send, Settings2 } from "lucide-react";

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
import { Link, RoutingLocations, useRoute } from "frontend/routing/router";
import { useWorkspaces } from "frontend/store/workspaces.store";

// import Logo from "frontend/assets/images/logo.svg?react";

const navigation: { title: string; url: RoutingLocations; icon: LucideIcon; isActive: boolean }[] = [
  {
    title: "Workspace",
    url: "workspace",
    icon: Inbox,
    isActive: true,
  },
  {
    title: "Network",
    url: "workspace.network",
    icon: Earth,
    isActive: false,
  },
  {
    title: "Cache",
    url: "workspace.cache",
    icon: Boxes,
    isActive: false,
  },
  {
    title: "Queues",
    url: "workspace.queues",
    icon: Atom,
    isActive: false,
  },
  {
    title: "Settings",
    url: "workspace.settings",
    icon: Settings2,
    isActive: false,
  },
];

export function ProjectSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const {
    params: { workspaceId },
  } = useRoute("workspace");
  const { workspaces } = useWorkspaces();
  const workspace = workspaces.find((w) => w.id === workspaceId);
  // const { activeWorkspace, workspaces } = useOnlineProjects("project");

  // const workspace = workspaces[activeWorkspace!];
  // const { client } = workspace;

  if (!workspace) {
    return null;
  }

  return (
    <SidebarProvider className="min-h-full">
      <Sidebar
        variant="inset"
        collapsible="none"
        className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row rounded-xl bg-transparent pr-1"
        {...props}
      >
        {/* This is the first sidebar */}
        {/* We disable collapsible and adjust width to icon. */}
        {/* This will make the sidebar appear as icons. */}
        <SidebarHeader>
          <SidebarMenu className="mt-2 mb-3">
            <SidebarMenuItem className="flex justify-center">
              <SidebarMenuButton
                size="lg"
                asChild
                className="cursor-pointer flex aspect-square size-10 items-center justify-center rounded-lg bg-yellow-500 text-sidebar-primary-foreground"
              >
                <Link to="dashboard">
                  <Home className="!size-5" />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="p-0">
            <SidebarGroupContent className="p-0">
              <SidebarMenu className="p-0">
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link to={item.url} params={{ workspaceId: workspace?.id }} className="flex flex-col h-15">
                        <item.icon className="!size-5" />
                        <span className="text-[10px]">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>{/* <Logo className="size-10 mx-auto" /> */}</SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}

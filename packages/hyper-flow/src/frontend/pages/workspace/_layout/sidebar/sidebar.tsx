"use client";

import * as React from "react";
import { Link, LinkProps } from "@tanstack/react-router";
import { Atom, Book, Boxes, Earth, Home, Inbox, LucideIcon, Settings2 } from "lucide-react";

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
} from "@/components/ui/sidebar";
import { useWorkspaces } from "@/store/workspace/workspaces.store";

// import Logo from "@/assets/images/logo.svg?react";

export function ApplicationSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const workspaceId = "1";
  const { workspaces } = useWorkspaces();
  const workspace = workspaces.find((w) => w.id === workspaceId);
  // const { activeWorkspace, workspaces } = useOnlineApplications("application");

  // const workspace = workspaces[activeWorkspace!];
  // const { client } = workspace;

  const navigation: ({ title: string; icon: LucideIcon; isActive: boolean } & Pick<LinkProps, "to" | "params">)[] = [
    {
      title: "Workspace",
      to: "/workspaces/$workspaceId",
      params: { workspaceId },
      icon: Inbox,
      isActive: true,
    },
    {
      title: "APIs",
      to: "/workspaces/$workspaceId/apis",
      params: { workspaceId },
      icon: Earth,
      isActive: false,
    },
    {
      title: "Docs",
      to: "/workspaces/$workspaceId/documentation",
      params: { workspaceId },
      icon: Book,
      isActive: false,
    },
    {
      title: "Testing",
      to: "/workspaces/$workspaceId/testing",
      params: { workspaceId },
      icon: Atom,
      isActive: false,
    },
    {
      title: "Mocks",
      to: "/workspaces/$workspaceId/mocks",
      params: { workspaceId },
      icon: Boxes,
      isActive: false,
    },
    {
      title: "Settings",
      to: "/workspaces/$workspaceId/settings",
      params: { workspaceId },
      icon: Settings2,
      isActive: false,
    },
  ];

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
                <Link to="/">
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
                      <Link to={item.to} params={item.params} className="flex flex-col h-15">
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

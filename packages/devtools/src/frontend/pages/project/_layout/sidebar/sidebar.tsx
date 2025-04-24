"use client";

import * as React from "react";
import { Atom, Boxes, Earth, Home, Inbox, LucideIcon, Settings2 } from "lucide-react";

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
import { Link, RoutingLocations, useMatchedName, useRoute } from "frontend/routing/router";
import { useProjects } from "frontend/store/project/projects.store";
import { cn } from "frontend/lib/utils";
import Logo from "../../../../assets/images/logo.svg?react";

// import Logo from "frontend/assets/images/logo.svg?react";

const navigation: { title: string; url: RoutingLocations; icon: LucideIcon; isActive: boolean }[] = [
  {
    title: "Project",
    url: "project",
    icon: Inbox,
    isActive: true,
  },
  // {
  //   title: "Requests",
  //   url: "project.requests",
  //   icon: Earth,
  //   isActive: false,
  // },
  {
    title: "Network",
    url: "project.network",
    icon: Earth,
    isActive: false,
  },
  {
    title: "Cache",
    url: "project.cache",
    icon: Boxes,
    isActive: false,
  },
  {
    title: "Queues",
    url: "project.queues",
    icon: Atom,
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
  const {
    params: { projectName },
  } = useRoute("project");
  const { projects } = useProjects();
  const activeName = useMatchedName();
  const project = projects[projectName];

  const getIsActive = (name: RoutingLocations) => {
    return activeName === name;
  };

  if (!project) {
    return <div />;
  }

  return (
    <SidebarProvider className="min-h-full">
      <Sidebar
        variant="inset"
        collapsible="none"
        className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row rounded-xl bg-transparent pr-1"
        {...props}
      >
        <SidebarHeader>
          <SidebarMenu className="mt-2 mb-3">
            <SidebarMenuItem className="flex justify-center">
              <SidebarMenuButton
                size="lg"
                asChild
                className="cursor-pointer flex aspect-square size-10 items-center justify-center rounded-lg bg-yellow-500 hover:bg-yellow-500/80 text-sidebar-primary-foreground"
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
                    <SidebarMenuButton asChild className={cn(!getIsActive(item.url) ? "opacity-60" : "bg-gray-400/10")}>
                      <Link to={item.url} params={{ projectName }} className="flex flex-col h-15">
                        <item.icon className="!size-5" />
                        <span className="text-[11px]">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Logo className="size-10 mx-auto mb-2" />
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}

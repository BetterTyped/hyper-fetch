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
} from "@/components/ui/sidebar";
import { useApplications } from "@/store/applications/apps.store";
import { cn } from "@/lib/utils";
import logo from "../../../../assets/images/icon.png";
import { Link, LinkProps, useMatch, useParams } from "@tanstack/react-router";

export function ApplicationSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { applicationName } = useParams({ strict: false });
  const { applications } = useApplications();
  const { pathname } = useMatch({ strict: false });
  const application = applications[applicationName as string];

  const navigation: ({ title: string; icon: LucideIcon; isActive: boolean } & Pick<LinkProps, "to" | "params">)[] = [
    {
      title: "Application",
      to: "/applications/$applicationName",
      params: { applicationName },
      icon: Inbox,
      isActive: true,
    },
    // {
    //   title: "Requests",
    //   url: "application.requests",
    //   icon: Earth,
    //   isActive: false,
    // },
    {
      title: "Network",
      to: "/applications/$applicationName/network",
      params: { applicationName },
      icon: Earth,
      isActive: false,
    },
    {
      title: "Cache",
      to: "/applications/$applicationName/cache",
      params: { applicationName },
      icon: Boxes,
      isActive: false,
    },
    {
      title: "Queues",
      to: "/applications/$applicationName/queues",
      params: { applicationName },
      icon: Atom,
      isActive: false,
    },
    {
      title: "Settings",
      to: "/applications/$applicationName/settings",
      params: { applicationName },
      icon: Settings2,
      isActive: false,
    },
  ];

  const getIsActive = (name: string) => {
    return pathname === name;
  };

  if (!application) {
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
                className="cursor-pointer flex aspect-square size-10 items-center justify-center rounded-lg bg-yellow-500 hover:bg-yellow-500/80 active:bg-yellow-500/60 text-sidebar-primary-foreground"
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
                    <SidebarMenuButton asChild className={cn(!getIsActive(item.to!) ? "opacity-60" : "bg-zinc-400/10")}>
                      <Link to={item.to} params={item.params} className="flex flex-col h-15">
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
          <img src={logo} alt="Hyper Flow" className="size-10 mx-auto mb-2" />
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}

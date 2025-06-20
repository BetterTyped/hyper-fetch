import { Link, LinkProps, useMatch } from "@tanstack/react-router";
import { ChevronRight, type LucideIcon, AlertTriangle } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useSettings } from "@/store/app/settings.store";

export function NavPrimary({
  items,
}: {
  items: Array<
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
  >;
}) {
  const match = useMatch({
    strict: false,
  });
  const serverStatus = useSettings((state) => state.serverStatus);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={item.title} isActive={match.pathname === item.to}>
                <Link to={item.to} params={item.params} className="h-[34px] px-3">
                  <item.icon className="min-w-[18px] min-h-[18px]" />
                  <span className="text-[14px]">{item.title}</span>
                  {item.onCrash && serverStatus === "crashed" && (
                    <div className="ml-auto text-xs font-medium px-2 py-0.5 rounded-md animate-pulse flex items-center gap-1 pl-2">
                      <AlertTriangle className="h-3 w-3" />
                      Fix server
                    </div>
                  )}
                </Link>
              </SidebarMenuButton>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                      <ChevronRight />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={match.pathname === subItem.to}>
                            <Link to={subItem.to} params={subItem.params}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

import { ChevronRight, type LucideIcon, AlertTriangle } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "frontend/components/ui/collapsible";
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
} from "frontend/components/ui/sidebar";
import { Link, RoutingLocations, useMatchedName } from "frontend/routing/router";
import { useSettings } from "frontend/store/app/settings.store";

export function NavPrimary({
  items,
}: {
  items: {
    title: string;
    link: RoutingLocations;
    icon: LucideIcon;
    isActive?: boolean;
    onCrash?: boolean;
    items?: {
      title: string;
      link: RoutingLocations;
    }[];
  }[];
}) {
  const activeName = useMatchedName();
  const serverStatus = useSettings((state) => state.serverStatus);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={item.title} isActive={activeName === item.link}>
                <Link to={item.link} params={{} as any} className="h-[34px] px-3">
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
                          <SidebarMenuSubButton asChild isActive={activeName === subItem.link}>
                            <Link to={subItem.link} params={{} as any}>
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

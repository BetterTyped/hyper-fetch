import { Link, LinkProps } from "@tanstack/react-router";
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
import { useSettings } from "@/store/general/settings.store";

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
  const serverStatus = useSettings((state) => state.serverStatus);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={item.title}>
                <Link
                  to={item.to}
                  params={item.params}
                  className="h-[34px] px-3 opacity-60"
                  activeOptions={{ exact: true }}
                  activeProps={{ className: "bg-zinc-400/10 opacity-100" }}
                >
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
                          <SidebarMenuSubButton asChild>
                            <Link
                              to={subItem.to}
                              params={subItem.params}
                              activeOptions={{ exact: true }}
                              className="opacity-60"
                              activeProps={{ className: "bg-zinc-400/10 opacity-100" }}
                            >
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

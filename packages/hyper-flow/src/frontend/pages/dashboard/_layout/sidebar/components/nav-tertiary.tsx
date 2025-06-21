import * as React from "react";
import { LifeBuoy, Send, type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items: Array<{
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

export function NavTertiary(props: React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild size="sm">
                <a href={item.link} target="_blank" rel="noopener noreferrer">
                  <item.icon />
                  <span>{item.name}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

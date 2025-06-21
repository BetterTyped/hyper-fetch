import { Outlet } from "@tanstack/react-router";

import { DashboardSidebar } from "./sidebar/sidebar";

import { Content } from "@/components/ui/content";

export const DashboardLayout = () => {
  return (
    <div className="h-full w-full py-2 px-3">
      <Content className="grid grid-cols-[300px_1fr] h-full w-full p-0 gap-0 bg-sidebar overflow-hidden">
        <DashboardSidebar />
        <div className="border-l-[1px] [border-image:linear-gradient(to_bottom,theme(colors.zinc.900/.6),theme(colors.zinc.400/.6),theme(colors.zinc.900/.5))1] overflow-hidden h-full">
          <Outlet />
        </div>
      </Content>
    </div>
  );
};

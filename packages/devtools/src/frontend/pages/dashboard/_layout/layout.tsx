import { Outlet } from "@reins/router";

import { DashboardSidebar } from "./sidebar/sidebar";
import { Content } from "frontend/components/ui/content";

export const DashboardLayout = () => {
  return (
    <div className="h-full w-full py-2 px-3">
      <Content className="grid grid-cols-[270px_1fr] h-full w-full p-0 gap-0 bg-sidebar overflow-hidden">
        <DashboardSidebar />
        <div className="border-l-2 overflow-hidden h-full">
          <Outlet />
        </div>
      </Content>
    </div>
  );
};

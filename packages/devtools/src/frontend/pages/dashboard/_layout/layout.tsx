import { Outlet } from "@reins/router";

import { DashboardSidebar } from "./sidebar/sidebar";
import { Content } from "frontend/components/ui/content";

export const DashboardLayout = () => {
  return (
    <div className="h-full w-full py-2 px-1">
      <Content className="grid grid-cols-[250px_1fr] h-full w-full p-0 gap-0 bg-sidebar">
        <DashboardSidebar />
        <div className="border-l-2 p-4">
          <Outlet />
        </div>
      </Content>
    </div>
  );
};

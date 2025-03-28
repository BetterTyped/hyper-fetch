import { Outlet } from "@reins/router";

import { Card } from "frontend/components/ui/card";
import { DashboardSidebar } from "./sidebar/sidebar";

export const DashboardLayout = () => {
  return (
    <div className="h-full w-full py-2 px-1">
      <Card className="grid grid-cols-[250px_1fr] h-full w-full p-0 gap-0 bg-sidebar">
        <DashboardSidebar />
        <div className="border-l-2 p-4">
          <Outlet />
        </div>
      </Card>
    </div>
  );
};

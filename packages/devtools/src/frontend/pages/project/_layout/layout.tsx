import { Outlet } from "@reins/router";

import { ProjectSidebar } from "./sidebar/sidebar";
import { Content } from "frontend/components/ui/content";

export const ProjectLayout = () => {
  return (
    <div className="grid grid-cols-[70px_1fr] h-full w-full py-2 px-1">
      <ProjectSidebar />
      <Content>
        <Outlet />
      </Content>
    </div>
  );
};

import { Outlet } from "@reins/router";

import { ProjectSidebar } from "./sidebar/sidebar";
import { Content } from "frontend/components/ui/content";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { useConnectionStore } from "frontend/store/project/connection.store";
import { Badge } from "frontend/components/ui/badge";

export const ProjectLayout = () => {
  const { project } = useDevtools();
  const connected = useConnectionStore((state) => state.connections[project.name].connected);

  return (
    <div className="grid grid-cols-[70px_1fr] h-full w-full py-2 px-1">
      <ProjectSidebar />
      <Content className="relative">
        {!connected && (
          <div className="absolute left-1/2 top-2 z-50 -translate-x-1/2">
            <Badge variant="warning" className="flex items-center gap-2">
              <div className="relative flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
              </div>
              Disconnected
            </Badge>
          </div>
        )}
        <Outlet />
      </Content>
    </div>
  );
};

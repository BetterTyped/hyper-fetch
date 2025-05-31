import { Outlet } from "@reins/router";
import { Plug2 } from "lucide-react";

import { ProjectSidebar } from "./sidebar/sidebar";
import { Content } from "frontend/components/ui/content";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { useConnectionStore } from "frontend/store/project/connection.store";
import { Badge } from "frontend/components/ui/badge";

export const ProjectLayout = () => {
  const { project } = useDevtools();
  const connected = useConnectionStore((state) => !!state.connections[project.name]?.connected);

  return (
    <div className="grid grid-cols-[70px_1fr] h-full w-full py-2 px-1">
      <ProjectSidebar />
      <Content className="relative">
        {!connected && (
          <div className="absolute left-1/2 top-2 z-50 -translate-x-1/2">
            <Badge variant="destructive" className="flex items-center gap-1">
              <Plug2 className="w-5 h-5" />
              Offline
            </Badge>
          </div>
        )}
        <Outlet />
      </Content>
    </div>
  );
};

import { Outlet } from "@tanstack/react-router";
import { Plug2 } from "lucide-react";

import { ApplicationSidebar } from "./sidebar/sidebar";

import { Content } from "@/components/ui/content";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { useConnectionStore } from "@/store/applications/connection.store";
import { Badge } from "@/components/ui/badge";

export const ApplicationLayout = () => {
  const { application } = useDevtools();
  const connected = useConnectionStore((state) => !!state.connections[application.name]?.connected);

  return (
    <div className="grid grid-cols-[70px_1fr] h-full w-full py-2 px-1">
      <ApplicationSidebar />
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

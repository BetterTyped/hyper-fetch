import { Outlet, useParams } from "@tanstack/react-router";
import { Loader2, Plug2 } from "lucide-react";

import { ApplicationSidebar } from "./sidebar/sidebar";
import { Badge } from "@/components/ui/badge";
import { Content } from "@/components/ui/content";
import { useApplications } from "@/store/applications/apps.store";
import { useConnectionStore } from "@/store/applications/connection.store";

export const ApplicationLayout = () => {
  const { applicationName = "" } = useParams({ strict: false });
  const isKnown = useApplications((state) => !!state.applications[applicationName]);
  const connected = useConnectionStore((state) => !!state.connections[applicationName]?.connected);

  // Opened before the application ever connected, e.g. a restored route
  if (!isKnown) {
    return (
      <div
        data-testid="application-waiting"
        className="flex flex-col items-center justify-center gap-3 h-full w-full text-muted-foreground"
      >
        <Loader2 className="size-6 animate-spin" />
        <p className="text-sm">Waiting for {applicationName} to connect...</p>
      </div>
    );
  }

  return (
    <div data-testid="application-page" className="grid grid-cols-[70px_1fr] h-full w-full py-2 px-1">
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

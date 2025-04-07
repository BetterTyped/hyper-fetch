import { useShallow } from "zustand/react/shallow";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { useNetworkStore } from "frontend/store/project/network.store";
import { Method } from "frontend/components/ui/method";
import { EmptyState } from "frontend/components/ui/empty-state";
import { cn } from "frontend/lib/utils";

export const CardRecent = ({ className }: { className?: string }) => {
  const { project } = useDevtools();

  const { requests } = useNetworkStore(
    useShallow((state) => ({
      requests: state.projects[project.name].requests,
    })),
  );

  return (
    <Card className={cn(className)}>
      <>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
          <CardDescription>Last few requests processed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.length === 0 ? (
              <EmptyState title="Waiting for API activity" description="No requests processed yet" />
            ) : (
              requests.slice(0, 5).map((item) => (
                <div key={item.requestId} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${item.isSuccess ? "bg-green-500" : "bg-red-500"}`} />
                  <Method method={item.request.method} />
                  <span className="text-sm font-medium truncate flex-1">{item.request.endpoint}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.details?.triggerTimestamp ?? 0).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </>
    </Card>
  );
};

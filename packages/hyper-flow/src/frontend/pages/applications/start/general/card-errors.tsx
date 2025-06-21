import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { AlertCircle, ThumbsUp } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/no-content/empty-state";
import { useErrorStatsStore } from "@/store/applications/error-stats.store";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { cn } from "@/lib/utils";
import { Method } from "@/components/ui/method";

export const CardErrors = ({ className }: { className?: string }) => {
  const { application } = useDevtools();

  const { endpointErrorStats } = useErrorStatsStore(
    useShallow((state) => ({
      endpointErrorStats: state.applications[application.name].endpointErrorStats,
    })),
  );

  const topFailingEndpoints = useMemo(() => {
    return Array.from(endpointErrorStats.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [endpointErrorStats]);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <CardTitle>Error Summary</CardTitle>
        </div>
        <CardDescription>
          Track and analyze endpoint errors to improve your application&apos;s reliability
        </CardDescription>
      </CardHeader>
      <CardContent>
        {endpointErrorStats.size === 0 ? (
          <EmptyState
            icon={ThumbsUp}
            title="No errors detected"
            description="Everything is looking good and healthy!"
          />
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm font-medium text-muted-foreground">Endpoint</span>
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <span className="text-sm font-medium text-muted-foreground">Count</span>
            </div>
            {topFailingEndpoints.map((endpoint) => (
              <div key={endpoint.status} className="grid grid-cols-3 gap-2">
                <span className="text-sm font-medium">
                  <Method method={endpoint.method} className="text-base mt-0.5" /> {endpoint.endpoint}
                </span>
                <span className="text-sm font-medium text-muted-foreground">{endpoint.status}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{endpoint.count} errors</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

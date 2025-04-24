import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { Badge } from "frontend/components/ui/badge";
import { EmptyState } from "frontend/components/ui/empty-state";
import { useErrorStatsStore } from "frontend/store/project/error-stats.store";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { cn } from "frontend/lib/utils";
import { Method } from "frontend/components/ui/method";
import { EmptyBox } from "frontend/components/ui/empty-box";

export const CardErrors = ({ className }: { className?: string }) => {
  const { project } = useDevtools();

  const { endpointErrorStats } = useErrorStatsStore(
    useShallow((state) => ({
      endpointErrorStats: state.projects[project.name].endpointErrorStats,
    })),
  );

  const mostFailingEndpoint = useMemo(() => {
    return Array.from(endpointErrorStats.values()).sort((a, b) => b.count - a.count)[0];
  }, [endpointErrorStats]);

  const topFailingEndpoints = useMemo(() => {
    return Array.from(endpointErrorStats.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [endpointErrorStats]);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Error Summary</CardTitle>
        <CardDescription>Common errors and issues</CardDescription>
      </CardHeader>
      <CardContent>
        {endpointErrorStats.size === 0 ? (
          <EmptyState title="No errors detected" description="Everything is looking good!" />
        ) : (
          <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4">
            <div>
              <p className="text-md font-medium text-muted-foreground mb-1">Most failing endpoint</p>
              {mostFailingEndpoint && (
                <p className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-lg">
                    <Method method={mostFailingEndpoint.method} className="text-base mt-0.5" />{" "}
                    {mostFailingEndpoint.endpoint}
                  </div>
                  <Badge variant="secondary">{mostFailingEndpoint.count} occurrences</Badge>
                </p>
              )}
              {!mostFailingEndpoint && <EmptyBox title="No errors detected" />}
            </div>
            <div className="space-y-2 md:-mt-16">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};

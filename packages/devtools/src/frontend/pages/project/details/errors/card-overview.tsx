import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { cn } from "frontend/lib/utils";
import { useNetworkStatsStore } from "frontend/store/project/network-stats.store";
import { toNumber } from "frontend/store/project/utils";

export const CardOverview = ({ className }: { className?: string }) => {
  const { project } = useDevtools();
  const networkEntries = useNetworkStatsStore(useShallow((state) => state.projects[project.name].networkEntries));
  const networkStats = useNetworkStatsStore(useShallow((state) => state.projects[project.name].networkStats));

  const mostUsedRequest = useMemo(() => {
    return Array.from(networkEntries.values()).sort((a, b) => b.stats.totalRequests - a.stats.totalRequests)[0];
  }, [networkEntries]);

  const slowestRequest = useMemo(() => {
    return Array.from(networkEntries.values()).sort((a, b) => b.stats.avgResponseTime - a.stats.avgResponseTime)[0];
  }, [networkEntries]);

  const errorRate = useMemo(() => {
    return toNumber((networkStats.totalRequestsFailed / networkStats.totalRequests) * 100);
  }, [networkStats]);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Request Patterns</CardTitle>
        <CardDescription>Analysis of your application&apos;s request patterns over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-gray-900 rounded-md border flex flex-col items-center">
            <p className="text-sm font-medium text-muted-foreground">Most used request</p>
            <p className="text-lg font-bold mt-1">{mostUsedRequest?.endpoint || "No data available"}</p>
            {mostUsedRequest && (
              <p className="text-xs text-muted-foreground mt-1">
                {mostUsedRequest.stats.totalRequests} call{mostUsedRequest.stats.totalRequests !== 1 ? "s" : ""}
              </p>
            )}
            {!mostUsedRequest && <p className="text-xs text-muted-foreground mt-1">No data available</p>}
          </div>

          <div className="p-3 bg-gray-900 rounded-md border flex flex-col items-center">
            <p className="text-sm font-medium text-muted-foreground">Slowest request</p>
            <p className="text-lg font-bold mt-1">{slowestRequest?.endpoint || "No data available"}</p>
            {slowestRequest && (
              <p className="text-xs text-muted-foreground mt-1">
                {slowestRequest.stats.avgResponseTime.toFixed(0)} ms avg
              </p>
            )}
            {!slowestRequest && <p className="text-xs text-muted-foreground mt-1">No data available</p>}
          </div>

          <div className="p-3 bg-gray-900 rounded-md border flex flex-col items-center">
            <p className="text-sm font-medium text-muted-foreground">Error rate</p>
            <p className="text-lg font-bold mt-1">{errorRate.toFixed(1)}%</p>
            {!!networkStats.totalRequestsFailed && (
              <p className="text-xs text-muted-foreground mt-1">
                {networkStats.totalRequestsFailed} failed request{networkStats.totalRequestsFailed !== 1 ? "s" : ""}
              </p>
            )}
            {!networkStats.totalRequestsFailed && (
              <p className="text-xs text-muted-foreground mt-1">No failed requests found</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

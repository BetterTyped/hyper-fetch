import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { Activity, AlertCircle, Clock } from "lucide-react";

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
          <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
            <div className="flex flex-col gap-2">
              <div className="flex items-top gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Most used request</p>
              </div>
              <div className="pl-12 -mt-6">
                <p className="text-xl font-bold">{mostUsedRequest?.endpoint || "No data available"}</p>
                {mostUsedRequest && (
                  <p className="text-sm text-muted-foreground">
                    {mostUsedRequest.stats.totalRequests} call{mostUsedRequest.stats.totalRequests !== 1 ? "s" : ""}
                  </p>
                )}
                {!mostUsedRequest && <p className="text-sm text-muted-foreground">No data available</p>}
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
            <div className="flex flex-col gap-2">
              <div className="flex items-top gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Slowest request</p>
              </div>
              <div className="pl-12 -mt-6">
                <p className="text-xl font-bold">{slowestRequest?.endpoint || "No data available"}</p>
                {slowestRequest && (
                  <p className="text-sm text-muted-foreground">
                    {slowestRequest.stats.avgResponseTime.toFixed(0)} ms avg
                  </p>
                )}
                {!slowestRequest && <p className="text-sm text-muted-foreground">No data available</p>}
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
            <div className="flex flex-col gap-2">
              <div className="flex items-top gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Error rate</p>
              </div>
              <div className="pl-12 -mt-6">
                <p className="text-xl font-bold">{errorRate.toFixed(1)}%</p>
                {!!networkStats.totalRequestsFailed && (
                  <p className="text-sm text-muted-foreground">
                    {networkStats.totalRequestsFailed} failed request{networkStats.totalRequestsFailed !== 1 ? "s" : ""}
                  </p>
                )}
                {!networkStats.totalRequestsFailed && (
                  <p className="text-sm text-muted-foreground">No failed requests found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

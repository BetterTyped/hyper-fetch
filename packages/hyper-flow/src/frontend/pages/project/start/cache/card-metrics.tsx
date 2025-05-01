import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { Progress } from "frontend/components/ui/progress";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { useCacheStatsStore } from "frontend/store/project/cache-stats.store";
import { useCacheStore } from "frontend/store/project/cache.store";
import { ChartCache } from "frontend/components/charts/chart-cache";
import { useNetworkStatsStore } from "frontend/store/project/network-stats.store";
import { toNumber } from "frontend/store/project/utils";
import { cn } from "frontend/lib/utils";

export const CardMetrics = ({ className }: { className?: string }) => {
  const { project } = useDevtools();

  const { caches } = useCacheStore(useShallow((state) => ({ caches: state.projects[project.name].caches })));

  const { generalStats, cachesStats } = useCacheStatsStore(
    useShallow((state) => ({
      generalStats: state.projects[project.name].generalStats,
      cachesStats: state.projects[project.name].cachesStats,
    })),
  );

  const { networkStats } = useNetworkStatsStore(
    useShallow((state) => ({ networkStats: state.projects[project.name].networkStats })),
  );

  const chartData = useMemo(() => {
    return Array.from(cachesStats.values()).map((cache) => ({
      name: `${cache.method} ${cache.endpoint}`,
      endpoint: cache.endpoint,
      method: cache.method,
      totalSize: cache.generalStats.cacheSize,
      totalEntries: cache.cacheEntries.size,
    }));
  }, [cachesStats]);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Cache Metrics</CardTitle>
        <CardDescription>Overall cache performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Cache Usage</h3>
          <div className="flex items-center gap-2">
            <Progress
              value={toNumber((networkStats.totalCachedRequests / networkStats.totalRequests) * 100)}
              className="h-2 flex-1"
            />
            <span className="text-sm font-bold">
              {toNumber((networkStats.totalCachedRequests / networkStats.totalRequests) * 100).toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Cache Size</h3>
            <p className="text-2xl font-bold">{generalStats.cacheSize} KB</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Entries</h3>
            <p className="text-2xl font-bold">{caches.size}</p>
          </div>
        </div>

        <div className="space-y-1 pt-4 border-t">
          <h3 className="text-sm font-medium mb-2">Cache Distribution</h3>
          <div className="w-full border border-slate-500 rounded-md relative overflow-hidden aspect-1/1">
            <div className="w-[calc(100%+2px)] h-[calc(100%+2px)] ml-[-1px] mt-[-1px]">
              <ChartCache data={chartData} totalSize={generalStats.cacheSize} />
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-700 rounded-full" />
              Large
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
              Medium
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-300 rounded-full" />
              Small
            </span>
          </div>
        </div>
        {/* <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between">
            <h3 className="text-sm font-medium">Stale Entries</h3>
            <span className="text-sm font-medium">{generalStats.stale}</span>
          </div>
          <Progress value={(generalStats.stale / caches.size) * 100} className="h-2" />
        </div>
        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between">
            <h3 className="text-sm font-medium">Stale Entries</h3>
            <span className="text-sm font-medium">{generalStats.stale}</span>
          </div>
          <Progress value={(generalStats.stale / caches.size) * 100} className="h-2" />
        </div>
        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between">
            <h3 className="text-sm font-medium">Stale Entries</h3>
            <span className="text-sm font-medium">{generalStats.stale}</span>
          </div>
          <Progress value={(generalStats.stale / caches.size) * 100} className="h-2" />
        </div> */}
      </CardContent>
    </Card>
  );
};

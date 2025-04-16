import { BarChart2 } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { cn } from "frontend/lib/utils";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { useNetworkStatsStore } from "frontend/store/project/network-stats.store";
import { formatBytes } from "frontend/utils/size.utils";
import { getMethodColor, Method } from "frontend/components/ui/method";

export const CardTraffic = ({ className }: { className?: string }) => {
  const { project } = useDevtools();
  const { networkStats, networkEntries } = useNetworkStatsStore(useShallow((state) => state.projects[project.name]));

  const trafficByEndpoint = Array.from(networkEntries.values())
    .sort((a, b) => b.stats.totalRequests - a.stats.totalRequests)
    .slice(0, 10);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4" />
          Top traffic by Endpoint
        </CardTitle>
        <CardDescription>Number of requests and data responses by endpoint</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {trafficByEndpoint.map((item) => (
            <div key={item.endpoint} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Method method={item.method} />
                  <span className="font-medium">{item.endpoint}</span>
                </div>
                <span className="text-sm">
                  {((item.stats.totalRequests / networkStats.totalRequests) * 100).toFixed(1)}% (
                  {formatBytes(item.stats.totalTransferredResponse)})
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full">
                <div className={`h-2 w-full opacity-25 ${getMethodColor(item.method).background}`} />
                <div
                  className={`absolute left-0 top-0 h-full rounded-r-full ${getMethodColor(item.method).background}`}
                  style={{ width: `${(item.stats.totalRequests / networkStats.totalRequests) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

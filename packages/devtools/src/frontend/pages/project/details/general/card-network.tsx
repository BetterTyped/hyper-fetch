import { Earth } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { Progress } from "frontend/components/ui/progress";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { cn } from "frontend/lib/utils";
import { useNetworkStatsStore } from "frontend/store/project/network-stats.store";
import { toNumber } from "frontend/store/project/utils";
import { formatBytes } from "frontend/utils/size.utils";

export const CardNetwork = ({ className }: { className?: string }) => {
  const { project } = useDevtools();
  const { networkStats } = useNetworkStatsStore(useShallow((state) => state.projects[project.name]));

  const successRate = toNumber((networkStats.totalRequestsSuccess * 100) / networkStats.totalRequests);
  const cachingRate = toNumber((networkStats.totalCachedRequests * 100) / networkStats.totalRequests);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Earth className="h-5 w-5" />
          Network Overview
        </CardTitle>
        <CardDescription>Traffic summary statistics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Requests</p>
            <p className="text-2xl font-bold">{networkStats.totalRequests}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Success Requests</p>
            <p className="text-2xl font-bold">{networkStats.totalRequestsSuccess}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Transferred</p>
            <p className="text-2xl font-bold">{formatBytes(networkStats.totalTransferredPayload)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Payload Size</p>
            <p className="text-2xl font-bold">{formatBytes(networkStats.avgPayloadSize)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Fetched</p>
            <p className="text-2xl font-bold">{formatBytes(networkStats.totalTransferredResponse)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Response Size</p>
            <p className="text-2xl font-bold">{formatBytes(networkStats.avgResponseSize)}</p>
          </div>
        </div>
        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span>Success rate</span>
            <span>{successRate.toFixed(1)}%</span>
          </div>
          <Progress value={successRate} className="h-2" />
        </div>
        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span>Caching rate</span>
            <span>{cachingRate.toFixed(1)}%</span>
          </div>
          <Progress value={cachingRate} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};

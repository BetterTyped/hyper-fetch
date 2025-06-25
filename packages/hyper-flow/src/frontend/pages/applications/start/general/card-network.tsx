import { Earth } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { cn } from "@/lib/utils";
import { useNetworkStatsStore } from "@/store/applications/network-stats.store";
import { toNumber } from "@/store/applications/utils";
import { formatBytes } from "@/utils/size.utils";
import { AdapterIcon } from "@/components/ui/adapter-icon";
import { Badge } from "@/components/ui/badge";

export const CardNetwork = ({ className }: { className?: string }) => {
  const { application } = useDevtools();
  const { networkStats } = useNetworkStatsStore(useShallow((state) => state.applications?.[application.name]));

  const successRate = toNumber((networkStats.totalRequestsSuccess * 100) / networkStats.totalRequests);

  return (
    <Card className={cn(className, "gap-3")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Earth className="h-4 w-4" />
          Network Overview
        </CardTitle>
        <CardDescription>Network overview for {application.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Adapter</p>
            <p>
              <Badge variant="secondary">
                <AdapterIcon name={application.adapterName} />
                {application.adapterName}
              </Badge>
            </p>
          </div>
          <div />
          <div>
            <p className="text-sm text-muted-foreground">Total Requests</p>
            <p className="text-2xl font-bold">{networkStats.totalRequests}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Success Requests</p>
            <p className="text-2xl font-bold">{networkStats.totalRequestsSuccess}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Fetched</p>
            <p className="text-2xl font-bold">{formatBytes(networkStats.totalTransferredResponse)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Response Size</p>
            <p className="text-2xl font-bold">{formatBytes(networkStats.avgResponseSize)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Sent</p>
            <p className="text-2xl font-bold">{formatBytes(networkStats.totalTransferredPayload)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Payload Size</p>
            <p className="text-2xl font-bold">{formatBytes(networkStats.avgPayloadSize)}</p>
          </div>
        </div>
        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span>Success rate</span>
            <span>{successRate.toFixed(1)}%</span>
          </div>
          <Progress value={successRate} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};

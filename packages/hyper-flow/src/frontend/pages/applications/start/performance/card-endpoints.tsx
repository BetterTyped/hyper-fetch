/* eslint-disable react/no-unstable-nested-components */
import { useMemo } from "react";

import { EmptyState } from "@/components/no-content/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Method } from "@/components/ui/method";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { cn } from "@/lib/utils";
import { useNetworkStatsStore } from "@/store/applications/network-stats.store";
import { toNumber } from "@/store/applications/utils";
import { formatBytes, formatTime } from "@/utils/format";

export const CardEndpoints = ({ className }: { className?: string }) => {
  const { application } = useDevtools();

  const networkEntries = useNetworkStatsStore((state) => state.applications[application.name].networkEntries);

  const slowestEndpoints = useMemo(() => {
    return [...networkEntries.values()]
      .toSorted((a, b) => b.stats.avgResponseTime - a.stats.avgResponseTime)
      .slice(0, 10);
  }, [networkEntries]);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Slowest Endpoints</CardTitle>
        <CardDescription>Endpoints with longest response times</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Endpoint</TableHead>
              <TableHead>Avg. Response Time</TableHead>
              <TableHead>Avg. Processing Time</TableHead>
              <TableHead>Avg. Response Size</TableHead>
            </TableRow>
          </TableHeader>
          {slowestEndpoints.length > 0 && (
            <TableBody>
              {slowestEndpoints.map((req) => (
                <TableRow key={`${req.method}-${req.endpoint}`}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Method method={req.method} />
                      {req.endpoint}
                    </div>
                  </TableCell>
                  <TableCell>{formatTime(req.stats.avgResponseTime)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={toNumber((req.stats.avgProcessingTime / req.stats.highestProcessingTime) * 100)}
                        className="h-2 w-24"
                      />
                      <span>{formatTime(req.stats.avgProcessingTime)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={toNumber((req.stats.avgResponseSize / req.stats.highestResponseSize) * 100)}
                        className="h-2 w-24"
                      />
                      <span>{formatBytes(req.stats.avgResponseSize)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
        {slowestEndpoints.length === 0 && (
          <EmptyState
            title="No endpoints statistics"
            description="Make some requests to see the data"
            className="mb-16 -mt-4/"
          />
        )}
      </CardContent>
    </Card>
  );
};

/* eslint-disable react/no-unstable-nested-components */
import { useMemo } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { EmptyState } from "@/components/no-content/empty-state";
import { Method } from "@/components/ui/method";
import { useMethodStatsStore } from "@/store/applications/method-stats.store";
import { cn } from "@/lib/utils";
import { formatBytes, formatTime } from "@/utils/format";

export const CardEndpoints = ({ className }: { className?: string }) => {
  const { application } = useDevtools();

  const methodsStats = useMethodStatsStore((state) => state.applications[application.name].methodsStats);

  const slowestEndpoints = useMemo(() => {
    return Array.from(methodsStats.values())
      .sort((a, b) => b.methodStats.avgResponseTime - a.methodStats.avgResponseTime)
      .slice(0, 10);
  }, [methodsStats]);

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
          {!!slowestEndpoints.length && (
            <TableBody>
              {slowestEndpoints.map((req) => (
                <TableRow key={req.method}>
                  <TableCell className="font-medium">
                    <Method method={req.method} />
                  </TableCell>
                  <TableCell>{formatTime(req.methodStats.avgResponseTime)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(req.methodStats.avgProcessingTime / req.methodStats.highestProcessingTime) * 100}
                        className="h-2 w-24"
                      />
                      <span>{formatTime(req.methodStats.avgProcessingTime)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(req.methodStats.avgResponseSize / req.methodStats.highestResponseSize) * 100}
                        className="h-2 w-24"
                      />
                      <span>{formatBytes(req.methodStats.avgResponseSize)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
        {!slowestEndpoints.length && (
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

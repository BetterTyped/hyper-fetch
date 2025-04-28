/* eslint-disable react/no-unstable-nested-components */
import { useMemo } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { Progress } from "frontend/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "frontend/components/ui/table";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { EmptyState } from "frontend/components/ui/empty-state";
import { Method } from "frontend/components/ui/method";
import { useMethodStatsStore } from "frontend/store/project/method-stats.store";
import { cn } from "frontend/lib/utils";

export const CardEndpoints = ({ className }: { className?: string }) => {
  const { project } = useDevtools();

  const methodsStats = useMethodStatsStore((state) => state.projects[project.name].methodsStats);

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
                  <TableCell>{req.methodStats.avgResponseTime}ms</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(req.methodStats.avgProcessingTime / req.methodStats.highestProcessingTime) * 100}
                        className="h-2 w-24"
                      />
                      <span>{req.methodStats.avgProcessingTime}ms</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(req.methodStats.avgResponseSize / req.methodStats.highestResponseSize) * 100}
                        className="h-2 w-24"
                      />
                      <span>{req.methodStats.avgResponseSize}ms</span>
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

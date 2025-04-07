import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "frontend/components/ui/table";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { useCacheStatsStore } from "frontend/store/project/cache-stats.store";
import { EmptyState } from "frontend/components/ui/empty-state";
import { cn } from "frontend/lib/utils";

export const CardNotCached = ({ className }: { className?: string }) => {
  const { project } = useDevtools();

  const { cacheStats } = useCacheStatsStore(
    useShallow((state) => ({
      cacheStats: state.projects[project.name].cachesStats,
      generalStats: state.projects[project.name].generalStats,
    })),
  );

  const notCachedEndpoints = useMemo(() => {
    return Object.entries(cacheStats).map(([key, value]) => ({
      endpoint: key,
      hits: value.hits,
      size: value.size,
      lastAccessed: value.lastAccessed,
      ttl: value.ttl,
    }));
  }, [cacheStats]);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Not Cached Endpoints</CardTitle>
        <CardDescription>Endpoints that are not cached</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Endpoint</TableHead>
              <TableHead>Hits</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Last Accessed</TableHead>
              <TableHead>TTL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notCachedEndpoints.map((endpoint) => (
              <TableRow key={endpoint.endpoint}>
                <TableCell className="font-medium">{endpoint.endpoint}</TableCell>
                <TableCell>{endpoint.hits}</TableCell>
                <TableCell>{endpoint.size}</TableCell>
                <TableCell>{endpoint.lastAccessed}</TableCell>
                <TableCell>{endpoint.ttl}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {!notCachedEndpoints.length && (
          <EmptyState title="No requests found" description="No requests have been made yet." />
        )}
      </CardContent>
    </Card>
  );
};

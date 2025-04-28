import { useMemo } from "react";
import { HelpCircle } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "frontend/components/ui/table";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { useCacheStatsStore } from "frontend/store/project/cache-stats.store";
import { EmptyState } from "frontend/components/ui/empty-state";
import { Tooltip, TooltipContent, TooltipTrigger } from "frontend/components/ui/tooltip";
import { cn } from "frontend/lib/utils";
import { Method } from "frontend/components/ui/method";
import { formatBytes } from "frontend/utils/size.utils";
import { EntriesDocs } from "frontend/components/docs/entries.docs";

export const CardNotCached = ({ className }: { className?: string }) => {
  const { project } = useDevtools();

  const { cacheStats } = useCacheStatsStore(
    useShallow((state) => ({
      cacheStats: state.projects[project.name].cachesStats,
      generalStats: state.projects[project.name].generalStats,
    })),
  );

  const notCachedEndpoints = useMemo(() => {
    return Array.from(cacheStats.values())
      .sort((a, b) => b.generalStats.notCachedSize - a.generalStats.notCachedSize)
      .filter((item) => item.notCachedEntries.size)
      .slice(0, 5);
  }, [cacheStats]);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Not Cached Requests</CardTitle>
        <CardDescription>Detected requests that were not cached</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Endpoint</TableHead>
              <TableHead>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center gap-1">
                      Entries
                      <HelpCircle className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <EntriesDocs />
                  </TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead>Size</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notCachedEndpoints.map((endpoint) => (
              <TableRow key={endpoint.endpoint}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Method method={endpoint.method} />
                    {endpoint.endpoint}
                  </div>
                </TableCell>
                <TableCell>{endpoint.notCachedEntries.size}</TableCell>
                <TableCell>{formatBytes(endpoint.generalStats.notCachedSize)}</TableCell>
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

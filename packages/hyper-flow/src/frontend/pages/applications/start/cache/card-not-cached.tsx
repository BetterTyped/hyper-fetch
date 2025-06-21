import { useMemo } from "react";
import { HelpCircle } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { useCacheStatsStore } from "@/store/applications/cache-stats.store";
import { EmptyState } from "@/components/no-content/empty-state";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Method } from "@/components/ui/method";
import { formatBytes } from "@/utils/size.utils";
import { EntriesDocs } from "@/components/docs/entries.docs";

export const CardNotCached = ({ className }: { className?: string }) => {
  const { application } = useDevtools();

  const { cacheStats } = useCacheStatsStore(
    useShallow((state) => ({
      cacheStats: state.applications[application.name].cachesStats,
      generalStats: state.applications[application.name].generalStats,
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

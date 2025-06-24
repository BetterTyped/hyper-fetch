import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { HelpCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { useCacheStatsStore } from "@/store/applications/cache-stats.store";
import { EmptyState } from "@/components/no-content/empty-state";
import { cn } from "@/lib/utils";
import { Method } from "@/components/ui/method";
import { formatBytes } from "@/utils/size.utils";
import { EntriesDocs } from "@/components/docs/entries.docs";

export const CardMostCached = ({ className }: { className?: string }) => {
  const { application } = useDevtools();

  const { cacheStats } = useCacheStatsStore(
    useShallow((state) => ({
      cacheStats: state.applications[application.name].cachesStats,
      generalStats: state.applications[application.name].generalStats,
    })),
  );

  const mostCachedEndpoints = useMemo(() => {
    return Array.from(cacheStats.values())
      .sort((a, b) => b.generalStats.cacheSize - a.generalStats.cacheSize)
      .filter((item) => item.cacheEntries.size)
      .slice(0, 5);
  }, [cacheStats]);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Most Cached Endpoints</CardTitle>
        <CardDescription>Endpoints with highest cache activity</CardDescription>
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
            {mostCachedEndpoints.map((endpoint) => (
              <TableRow key={endpoint.endpoint}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Method method={endpoint.method} />
                    {endpoint.endpoint}
                  </div>
                </TableCell>
                <TableCell>{endpoint.cacheEntries.size}</TableCell>
                <TableCell>{formatBytes(endpoint.generalStats.cacheSize)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {!mostCachedEndpoints.length && (
          <EmptyState title="No cached endpoints found" description="No endpoints have been cached yet." />
        )}
      </CardContent>
    </Card>
  );
};

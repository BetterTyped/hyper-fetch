import { ActivitySquare } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { EmptyState } from "@/components/no-content/empty-state";
import { useMethodStatsStore } from "@/store/applications/method-stats.store";
import { Badge } from "@/components/ui/badge";
import { Method } from "@/components/ui/method";
import { formatBytes } from "@/utils/size.utils";
import { formatTime } from "@/utils/format";

export const CardPatterns = ({ className }: { className?: string }) => {
  const { application } = useDevtools();

  const stats = useMethodStatsStore(useShallow((state) => state.applications[application.name]?.methodsStats));

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ActivitySquare className="w-4 h-4" />
          API Usage Patterns
        </CardTitle>
        <CardDescription>Common endpoint patterns and statistics in your application</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {!stats?.size && <EmptyState title="Analyzing API usage patterns..." description="No patterns detected yet." />}

        {Array.from(stats?.values() || []).map(({ method, methodStats }) => (
          <div key={method} className="p-3 border rounded-md bg-zinc-500/40">
            <div className="flex justify-between items-center">
              <span className="font-mono text-sm">
                <Method method={method} className="text-[15px]" />
              </span>
              <Badge variant="secondary">
                {methodStats.totalRequests} request{methodStats.totalRequests !== 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Average Response Time: {formatTime(methodStats.avgResponseTime || 0)}
            </div>
            <div className="text-xs text-muted-foreground">
              Average Response Size: {formatBytes(methodStats.avgResponseSize)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

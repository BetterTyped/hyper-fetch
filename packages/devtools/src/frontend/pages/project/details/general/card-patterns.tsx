import { ActivitySquare } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { cn } from "frontend/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { EmptyState } from "frontend/components/ui/empty-state";
import { useMethodStatsStore } from "frontend/store/project/method-stats.store";
import { Badge } from "frontend/components/ui/badge";
import { Method } from "frontend/components/ui/method";

export const CardPatterns = ({ className }: { className?: string }) => {
  const { project } = useDevtools();

  const methodStats = useMethodStatsStore(useShallow((state) => state.projects[project.name]?.methodsStats));

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
        {!methodStats.size && (
          <EmptyState title="Analyzing API usage patterns..." description="No patterns detected yet." />
        )}

        {Array.from(methodStats?.values() || []).map(({ method, networkStats }) => (
          <div key={method} className="p-3 border rounded-md bg-gray-500/40">
            <div className="flex justify-between items-center">
              <span className="font-mono text-sm">
                <Method method={method} className="text-[15px]" />
              </span>
              <Badge variant="secondary">
                {networkStats.totalRequests} request{networkStats.totalRequests !== 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Average Response Time: {networkStats.avgResponseTime?.toFixed(2)}ms
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

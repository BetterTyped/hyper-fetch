import { useShallow } from "zustand/react/shallow";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { Badge } from "frontend/components/ui/badge";
import { EmptyState } from "frontend/components/ui/empty-state";
import { useErrorStatsStore } from "frontend/store/project/error-stats.store";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { cn } from "frontend/lib/utils";

export const CardErrors = ({ className }: { className?: string }) => {
  const { project } = useDevtools();

  const { statusErrorStats } = useErrorStatsStore(
    useShallow((state) => ({
      statusErrorStats: state.projects[project.name].statusErrorStats,
    })),
  );

  // Group errors by status code or type
  const errorsByStatus = [].reduce(
    (acc) => {
      // const status = req.response?.status ?? "Unknown";
      // acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Get most frequent error
  const mostFrequentError = Object.entries(errorsByStatus).sort((a, b) => b[1] - a[1])[0] || ["None", 0];

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Error Summary</CardTitle>
        <CardDescription>Common errors and issues</CardDescription>
      </CardHeader>
      <CardContent>
        {statusErrorStats.size === 0 ? (
          <EmptyState title="No errors detected" description="Everything is looking good!" />
        ) : (
          <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4">
            <div>
              <p className="text-md font-medium text-muted-foreground mb-1">Most frequent error</p>
              <p className="flex items-center gap-2 text-xl font-bold">
                <Badge>Status {mostFrequentError[0]}</Badge> {mostFrequentError[1]} occurrences
              </p>
            </div>
            <div className="space-y-2 md:-mt-16">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Status</span>
                <span className="text-sm font-medium text-muted-foreground">Count</span>
              </div>
              {Object.entries(errorsByStatus)
                .sort((a, b) => Number(a[0]) - Number(b[0]))
                .filter((data, index) => index < 5)
                .map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      <Badge>Status: {status}</Badge>
                    </span>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

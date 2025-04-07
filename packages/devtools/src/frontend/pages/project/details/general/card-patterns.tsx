import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { cn } from "frontend/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { useNetworkStore } from "frontend/store/project/network.store";
import { EmptyState } from "frontend/components/ui/empty-state";

export const CardPatterns = ({ className }: { className?: string }) => {
  const { project } = useDevtools();

  const { requests } = useNetworkStore(
    useShallow((state) => ({
      requests: state.projects[project.name].requests,
    })),
  );

  // Find commonly used patterns in endpoints
  const endpointPatterns = useMemo(() => {
    const patterns: Record<string, number> = {};

    requests.forEach((req) => {
      // Extract path pattern (replace IDs with placeholders)
      const { endpoint } = req.request;
      const patternized = endpoint
        .replace(/\/[0-9a-f]{24}\b/g, "/:id") // MongoDB ObjectIds
        .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, "/:uuid") // UUIDs
        .replace(/\/\d+\b/g, "/:number"); // Simple numeric IDs

      patterns[patternized] = (patterns[patternized] || 0) + 1;
    });

    return Object.entries(patterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5 patterns
  }, [requests]);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>API Usage Patterns</CardTitle>
        <CardDescription>Common endpoint patterns detected in your application</CardDescription>
      </CardHeader>
      <CardContent>
        {endpointPatterns.length === 0 ? (
          <EmptyState title="Analyzing API usage patterns..." description="No patterns detected yet." />
        ) : (
          <div className="space-y-4">
            {endpointPatterns.map(([pattern, count]) => (
              <div key={pattern} className="p-3 border rounded-md bg-gray-500/40">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm">{pattern}</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{count} requests</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {count > 10 ? "High usage pattern" : "Normal usage pattern"}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { EmptyBox } from "@/components/no-content/empty-box";
import { useMethodStatsStore } from "@/store/applications/method-stats.store";
import { useNetworkStatsStore } from "@/store/applications/network-stats.store";
import { cn } from "@/lib/utils";
import { getMethodColor } from "@/components/ui/method";
import { formatTime, formatBytes } from "@/utils/format";

export const CardResponses = ({ className }: { className?: string }) => {
  const { application } = useDevtools();

  const { networkStats } = useNetworkStatsStore(
    useShallow((state) => ({
      networkStats: state.applications[application.name].networkStats,
    })),
  );

  const { methodsStats } = useMethodStatsStore(
    useShallow((state) => ({
      methodsStats: state.applications[application.name].methodsStats,
    })),
  );

  // Generate chart data from method statistics
  const chartData = useMemo(() => {
    // Convert methodStats to the array format expected by the chart
    return (
      Array.from(methodsStats.values())
        .map(({ method, methodStats }) => ({
          method,
          requests: methodStats.totalRequests,
          fill: getMethodColor(method).var,
        }))
        // Sort by method name for consistent display order
        .sort((a, b) => a.method.localeCompare(b.method))
    );
  }, [methodsStats]);

  const chartConfig: ChartConfig = useMemo(() => {
    return chartData.reduce((acc, { method, fill }) => {
      acc[method] = {
        label: method,
        color: fill,
      };
      return acc;
    }, {} as ChartConfig);
  }, [chartData]);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Response Times</CardTitle>
        <CardDescription>Average and percentile response times</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Average response time</span>
            <span className="text-sm font-bold">{formatTime(networkStats.avgResponseTime)}</span>
          </div>
          <Progress
            value={Math.min(100, (networkStats.avgResponseTime * 100) / networkStats.highestResponseTime)}
            className="h-2"
          />
        </div>
        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Average response size</span>
            <span className="text-sm font-bold">{formatBytes(networkStats.avgResponseSize)}</span>
          </div>
          <Progress
            value={Math.min(100, (networkStats.avgResponseSize * 100) / networkStats.highestResponseSize)}
            className="h-2"
          />
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium mb-4">Response time breakdown</h3>
          {!chartData.length && <EmptyBox title="No requests recorded yet" />}
          {!!chartData.length && (
            <ChartContainer config={chartConfig}>
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="method" tickLine={false} tickMargin={10} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <ChartLegend content={<ChartLegendContent verticalAlign="top" />} />
                <Bar dataKey="requests" strokeWidth={0} radius={8} />
              </BarChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

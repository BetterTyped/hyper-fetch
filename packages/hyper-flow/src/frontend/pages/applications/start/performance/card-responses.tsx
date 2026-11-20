import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { useShallow } from "zustand/react/shallow";

import { EmptyBox } from "@/components/no-content/empty-box";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getMethodColor } from "@/components/ui/method";
import { Progress } from "@/components/ui/progress";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { cn } from "@/lib/utils";
import { useMethodStatsStore } from "@/store/applications/method-stats.store";
import { getPercentile, useNetworkStatsStore } from "@/store/applications/network-stats.store";
import { formatTime, formatBytes } from "@/utils/format";

/** Share of `value` in `max` as a 0-100 progress value, `0` before anything was measured */
const toPercent = (value: number, max: number) => {
  if (!max || !Number.isFinite(value / max)) {
    return 0;
  }
  return Math.min(100, (value * 100) / max);
};

export const CardResponses = ({ className }: { className?: string }) => {
  const { application } = useDevtools();

  const { networkStats, responseTimeSamples } = useNetworkStatsStore(
    useShallow((state) => ({
      networkStats: state.applications[application.name].networkStats,
      responseTimeSamples: state.applications[application.name].responseTimeSamples,
    })),
  );

  const percentiles = useMemo(
    () =>
      ([50, 95, 99] as const).map((percentile) => ({
        label: `p${percentile}`,
        value: getPercentile(responseTimeSamples, percentile),
      })),
    [responseTimeSamples],
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
      [...methodsStats.values()]
        .map(({ method, methodStats }) => ({
          method,
          avgResponseTime: Math.round(methodStats.avgResponseTime),
          fill: getMethodColor(method).var,
        }))
        // Sort by method name for consistent display order
        .toSorted((a, b) => a.method.localeCompare(b.method))
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
          <Progress value={toPercent(networkStats.avgResponseTime, networkStats.highestResponseTime)} className="h-2" />
        </div>
        <div className="grid grid-cols-3 gap-2" data-testid="response-percentiles">
          {percentiles.map(({ label, value }) => (
            <div key={label} className="flex flex-col rounded-md bg-zinc-500/10 px-3 py-2">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-sm font-bold">{responseTimeSamples.length ? formatTime(value) : "-"}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Average response size</span>
            <span className="text-sm font-bold">{formatBytes(networkStats.avgResponseSize)}</span>
          </div>
          <Progress value={toPercent(networkStats.avgResponseSize, networkStats.highestResponseSize)} className="h-2" />
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium mb-4">Average response time by method</h3>
          {chartData.length === 0 && <EmptyBox title="No requests recorded yet" />}
          {chartData.length > 0 && (
            <ChartContainer config={chartConfig}>
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="method" tickLine={false} tickMargin={10} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent verticalAlign="top" />} />
                <Bar dataKey="avgResponseTime" name="Average response time (ms)" strokeWidth={0} radius={8} />
              </BarChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

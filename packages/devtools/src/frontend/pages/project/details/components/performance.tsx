/* eslint-disable react/no-unstable-nested-components */
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Rectangle, XAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "frontend/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { Progress } from "frontend/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "frontend/components/ui/table";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { EmptyState } from "frontend/components/ui/empty-state";
import { EmptyBox } from "frontend/components/ui/empty-box";
import { Method } from "frontend/components/ui/method";

const cachedColors = new Map<string, string>();

const generateMethodChartColor = (method: string) => {
  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  switch (method) {
    case "GET":
      return "hsl(var(--chart-2))";
    case "POST":
      return "hsl(var(--chart-1))";
    case "PATCH":
      return "hsl(var(--chart-3))";
    case "PUT":
      return "hsl(var(--chart-3))";
    case "DELETE":
      return "hsl(var(--chart-5))";
    default: {
      const color = colors[cachedColors.size % colors.length];
      cachedColors.set(method, color);
      return color;
    }
  }
};

export const PerformanceDashboard = () => {
  const {
    state: { requests, endpointsStats, generalStats, methodStats },
  } = useDevtools();

  // Calculate average response time
  const avgResponseTime =
    requests.length > 0
      ? requests
          .slice(0, 100)
          .filter((req) => !!req.response)
          .reduce((sum, req) => sum + (req.response!.responseTimestamp - req.response!.requestTimestamp), 0) /
        requests.slice(0, 20).length
      : 0;

  // Calculate 95th percentile response time
  const p95ResponseTime = useMemo(() => {
    const responseTimes = requests
      .filter((req) => !!req.response)
      .map((req) => req.response!.responseTimestamp - req.response!.requestTimestamp)
      .sort((a, b) => a - b);

    if (responseTimes.length === 0)
      return {
        value: 0,
        slowest: 0,
      };

    const idx = Math.ceil(responseTimes.length * 0.95) - 1;
    return {
      value: responseTimes[idx],
      slowest: responseTimes[responseTimes.length - 1],
    };
  }, [requests]);

  const slowestEndpoints = useMemo(() => {
    return Object.entries(endpointsStats)
      .sort((a, b) => b[1].avgResponseTime - a[1].avgResponseTime)
      .slice(0, 10);
  }, [endpointsStats]);

  // Generate chart data from method statistics
  const chartData = useMemo(() => {
    // Convert methodStats to the array format expected by the chart
    return (
      Object.entries(methodStats)
        .map(([method, stats]) => ({
          method,
          requests: stats.totalRequests,
          fill: generateMethodChartColor(method),
        }))
        // Sort by method name for consistent display order
        .sort((a, b) => a.method.localeCompare(b.method))
    );
  }, [methodStats]);

  const chartConfig: ChartConfig = useMemo(() => {
    return chartData.reduce((acc, { method }) => {
      acc[method] = {
        label: method,
        color: generateMethodChartColor(method),
      };
      return acc;
    }, {} as ChartConfig);
  }, [chartData]);

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-5">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Response Times</CardTitle>
          <CardDescription>Average and percentile response times</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Average response time</span>
              <span className="text-sm font-bold">{avgResponseTime.toFixed(2)}ms</span>
            </div>
            <Progress value={Math.min(100, (avgResponseTime * 100) / p95ResponseTime.slowest)} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">95th percentile</span>
              <span className="text-sm font-bold">{p95ResponseTime.value.toFixed(2)}ms</span>
            </div>
            <Progress value={Math.min(100, (p95ResponseTime.value * 100) / p95ResponseTime.slowest)} className="h-2" />
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
                  <Bar
                    dataKey="requests"
                    strokeWidth={0}
                    radius={8}
                    activeIndex={2}
                    activeBar={({ ...props }) => {
                      return (
                        <Rectangle
                          {...props}
                          fillOpacity={0.8}
                          stroke={props.payload.fill}
                          strokeDasharray={4}
                          strokeDashoffset={4}
                        />
                      );
                    }}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Slowest Endpoints</CardTitle>
          <CardDescription>Endpoints with longest response times</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>Avg. Response Time</TableHead>
                <TableHead>Avg. Processing Time</TableHead>
                <TableHead>Avg. Response Size</TableHead>
              </TableRow>
            </TableHeader>
            {!!slowestEndpoints.length && (
              <TableBody>
                {slowestEndpoints.map(([key, req]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">
                      <Method method={req.method} /> {req.endpoint}
                    </TableCell>
                    <TableCell>{req.avgResponseTime}ms</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{req.avgProcessingTime}ms</span>
                        <Progress value={(req.avgProcessingTime / req.avgResponseTime) * 100} className="h-2 w-24" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{req.avgResponseTime}ms</span>
                        <Progress
                          value={(generalStats.avgResponseTime / req.avgResponseTime) * 100}
                          className="h-2 w-24"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>
          {!slowestEndpoints.length && (
            <EmptyState
              title="No endpoints statistics"
              description="Make some requests to see the data"
              className="mb-16 -mt-4/"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

import { Treemap, ResponsiveContainer } from "recharts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "frontend/components/ui/tooltip";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { Progress } from "frontend/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "frontend/components/ui/table";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { cn } from "frontend/lib/utils";
import { useMemo } from "react";

const CustomizedContent = (props: {
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  fill: string;
  size: number;
}) => {
  const { depth, x, y, width, height, name, fill, size } = props;

  return (
    <g>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              style={{
                fill,
                strokeWidth: 2 / (depth + 1e-10),
                strokeOpacity: 1 / (depth + 1e-10),
              }}
              className="stroke-white"
            />
          </TooltipTrigger>
          <TooltipContent className="flex flex-col gap-1 p-2 border-gray-200 dark:border-gray-800 border !text-sm">
            <div className={cn("border-b border-inherit px-4 py-2")}>
              <p
                className={cn(
                  // base
                  "font-medium",
                  // text color
                  "text-gray-900 dark:text-gray-50",
                )}
              >
                {name}
              </p>
            </div>
            <div className={cn("space-y-1 px-4 py-2")}>
              <div className="flex items-center justify-between space-x-8">
                <div className="flex items-center space-x-2">
                  <span
                    aria-hidden="true"
                    className={cn("h-[3px] w-3.5 shrink-0 rounded-full")}
                    style={{
                      backgroundColor: fill,
                    }}
                  />
                  <p
                    className={cn(
                      // base
                      "whitespace-nowrap text-right",
                      // text color
                      "text-gray-700 dark:text-gray-300",
                    )}
                  >
                    Cache Size
                  </p>
                </div>
                <p
                  className={cn(
                    // base
                    "whitespace-nowrap text-right font-medium tabular-nums",
                    // text color
                    "text-gray-900 dark:text-gray-50",
                  )}
                >
                  {size} KB
                </p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {width > 50 && height > 20 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="#fff"
          fontSize={12}
          dominantBaseline="middle"
        >
          {size} KB
        </text>
      )}
    </g>
  );
};

const getDistributionFillColor = (cacheSize: number, totalCacheSize: number) => {
  // more than 50% of the total cache size
  if (cacheSize > totalCacheSize / 2) return "#1e40af";
  // more than 25% of the total cache size
  if (cacheSize > totalCacheSize / 4) return "#3b82f6";
  // more than 15% of the total cache size
  if (cacheSize > totalCacheSize / 6) return "#6fa4f9";
  // less than 15% of the total cache size
  return "#94bbf9";
};

export const CacheDashboard = () => {
  const {
    state: { cacheStats },
  } = useDevtools();

  // Mock data for cache analytics
  const cacheAnalytics = {
    hitRate: 78,
    cacheSize: "2.45 MB",
    entries: 124,
    staleEntries: 8,
    mostCachedEndpoints: [
      { endpoint: "/api/products", hits: 286, size: "420 KB", lastAccessed: "2 min ago", ttl: "5 min" },
      { endpoint: "/api/user/preferences", hits: 142, size: "12 KB", lastAccessed: "just now", ttl: "30 min" },
      { endpoint: "/api/categories", hits: 97, size: "156 KB", lastAccessed: "5 min ago", ttl: "1 hour" },
      { endpoint: "/api/recent-activity", hits: 64, size: "244 KB", lastAccessed: "1 min ago", ttl: "2 min" },
    ],
  };

  console.log(cacheStats);

  const data = useMemo(() => {
    const totalSize = Object.values(cacheStats).reduce((acc, curr) => acc + curr.size, 0);

    return [
      {
        name: "Cache",
        children: Object.entries(cacheStats).map(([key, value]) => ({
          name: key,
          size: value.size,
          fill: getDistributionFillColor(value.size, totalSize),
        })),
      },
    ];
  }, [cacheStats]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div className="md:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Cache Metrics</CardTitle>
            <CardDescription>Overall cache performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Cache Hit Rate</h3>
              <div className="flex items-center gap-2">
                <Progress value={cacheAnalytics.hitRate} className="h-2 flex-1" />
                <span className="text-sm font-bold">{cacheAnalytics.hitRate}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Cache Size</h3>
                <p className="text-2xl font-bold">{cacheAnalytics.cacheSize}</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Entries</h3>
                <p className="text-2xl font-bold">{cacheAnalytics.entries}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between">
                <h3 className="text-sm font-medium">Stale Entries</h3>
                <span className="text-sm font-medium">{cacheAnalytics.staleEntries}</span>
              </div>
              <Progress value={(cacheAnalytics.staleEntries / cacheAnalytics.entries) * 100} className="h-2" />
            </div>

            <div className="space-y-1 pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Cache Distribution</h3>
              <div className="h-38 w-full border border-slate-700 rounded-md relative overflow-hidden">
                <ResponsiveContainer className="-m-[1px] !w-[calc(100%+2px)] !h-[calc(100%+2px)]">
                  <Treemap
                    width={400}
                    height={200}
                    data={data}
                    nameKey="name"
                    dataKey="size"
                    aspectRatio={4 / 3}
                    className="fill-blue-500"
                    animationDuration={0}
                    content={<CustomizedContent depth={0} x={0} y={0} width={0} height={0} name="" fill="" size={0} />}
                  />
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-700 rounded-full" />
                  Large
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  Medium
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-300 rounded-full" />
                  Small
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Most Cached Endpoints</CardTitle>
          <CardDescription>Endpoints with highest cache activity</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>Hits</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Last Accessed</TableHead>
                <TableHead>TTL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cacheAnalytics.mostCachedEndpoints.map((endpoint, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{endpoint.endpoint}</TableCell>
                  <TableCell>{endpoint.hits}</TableCell>
                  <TableCell>{endpoint.size}</TableCell>
                  <TableCell>{endpoint.lastAccessed}</TableCell>
                  <TableCell>{endpoint.ttl}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200 text-sm text-blue-800">
            <p className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Using persistent cache could improve performance by ~23% based on your access patterns.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

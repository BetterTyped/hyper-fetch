import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { Progress } from "frontend/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "frontend/components/ui/table";

export const CacheAnalytics = ({ project }) => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-1 space-y-4">
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
              <div className="h-28 w-full bg-slate-100 rounded-md relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 bg-blue-300 h-1/2"></div>
                <div className="absolute bottom-0 left-0 w-3/5 bg-blue-500 h-1/4"></div>
                <div className="absolute bottom-0 left-0 w-1/4 bg-blue-700 h-1/6"></div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-700">
                  Visual representation
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-300 rounded-full"></span>
                  Frequent
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Common
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-700 rounded-full"></span>
                  Rare
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="md:col-span-2">
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

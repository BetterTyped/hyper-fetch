import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { Progress } from "frontend/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "frontend/components/ui/table";

export const PerformanceDashboard = ({ project }) => {
  // Mock data for performance metrics
  const performanceMetrics = {
    avgResponseTime: 230, // ms
    p95ResponseTime: 450, // ms
    slowestEndpoints: [
      { endpoint: "/api/products/recommendations", avgTime: 850, dataProcessingTime: 320 },
      { endpoint: "/api/analytics/dashboard", avgTime: 720, dataProcessingTime: 410 },
      { endpoint: "/api/users/search", avgTime: 580, dataProcessingTime: 210 },
      { endpoint: "/api/orders/history", avgTime: 520, dataProcessingTime: 180 },
      { endpoint: "/api/inventory/status", avgTime: 490, dataProcessingTime: 90 },
    ],
  };

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Response Times</CardTitle>
          <CardDescription>Average and percentile response times</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Average response time</span>
              <span className="text-sm font-bold">{performanceMetrics.avgResponseTime}ms</span>
            </div>
            <Progress value={Math.min(100, performanceMetrics.avgResponseTime / 10)} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">95th percentile</span>
              <span className="text-sm font-bold">{performanceMetrics.p95ResponseTime}ms</span>
            </div>
            <Progress value={Math.min(100, performanceMetrics.p95ResponseTime / 10)} className="h-2" />
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium mb-8">Response time breakdown</h3>
            <div className="h-40 flex items-end gap-3">
              <div className="relative h-full flex-1 flex flex-col justify-end">
                <div className="bg-blue-200 rounded-t w-full" style={{ height: "60%" }}></div>
                <div className="bg-blue-500 rounded-b w-full" style={{ height: "40%" }}></div>
                <span className="absolute bottom-full w-full text-center text-xs mb-1">GET</span>
              </div>
              <div className="relative h-full flex-1 flex flex-col justify-end">
                <div className="bg-green-200 rounded-t w-full" style={{ height: "40%" }}></div>
                <div className="bg-green-500 rounded-b w-full" style={{ height: "60%" }}></div>
                <span className="absolute bottom-full w-full text-center text-xs mb-1">POST</span>
              </div>
              <div className="relative h-full flex-1 flex flex-col justify-end">
                <div className="bg-yellow-200 rounded-t w-full" style={{ height: "30%" }}></div>
                <div className="bg-yellow-500 rounded-b w-full" style={{ height: "70%" }}></div>
                <span className="absolute bottom-full w-full text-center text-xs mb-1">PUT</span>
              </div>
              <div className="relative h-full flex-1 flex flex-col justify-end">
                <div className="bg-red-200 rounded-t w-full" style={{ height: "20%" }}></div>
                <div className="bg-red-500 rounded-b w-full" style={{ height: "30%" }}></div>
                <span className="absolute bottom-full w-full text-center text-xs mb-1">DELETE</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>▉ Network</span>
              <span>▉ Processing</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Slowest Endpoints</CardTitle>
          <CardDescription>Endpoints with longest response times</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>Avg. Time</TableHead>
                <TableHead>Data Processing</TableHead>
                <TableHead>Network</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performanceMetrics.slowestEndpoints.map((endpoint, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{endpoint.endpoint}</TableCell>
                  <TableCell>{endpoint.avgTime}ms</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{endpoint.dataProcessingTime}ms</span>
                      <Progress value={(endpoint.dataProcessingTime / endpoint.avgTime) * 100} className="h-2 w-24" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{endpoint.avgTime - endpoint.dataProcessingTime}ms</span>
                      <Progress
                        value={((endpoint.avgTime - endpoint.dataProcessingTime) / endpoint.avgTime) * 100}
                        className="h-2 w-24"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

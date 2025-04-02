import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";

export const NetworkTraffic = () => {
  const { project } = useDevtools();

  // Mock data for network traffic
  const networkMetrics = {
    totalRequests: 1254,
    totalTransferred: "8.7 MB",
    avgRequestSize: "7.2 KB",
    avgResponseSize: "22.4 KB",
    requestsPerMinute: 42,
    trafficByContentType: [
      { type: "application/json", size: "5.2 MB", percentage: 60 },
      { type: "text/html", size: "1.8 MB", percentage: 21 },
      { type: "image/*", size: "1.1 MB", percentage: 13 },
      { type: "other", size: "0.6 MB", percentage: 6 },
    ],
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Network Overview</CardTitle>
          <CardDescription>Traffic summary statistics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <p className="text-2xl font-bold">{networkMetrics.totalRequests}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Requests/min</p>
              <p className="text-2xl font-bold">{networkMetrics.requestsPerMinute}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Transferred</p>
              <p className="text-2xl font-bold">{networkMetrics.totalTransferred}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Response</p>
              <p className="text-2xl font-bold">{networkMetrics.avgResponseSize}</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Request methods</h3>
            </div>
            <div className="h-4 w-full rounded-full overflow-hidden flex">
              <div className="bg-blue-500 h-full" style={{ width: "65%" }}></div>
              <div className="bg-green-500 h-full" style={{ width: "20%" }}></div>
              <div className="bg-yellow-500 h-full" style={{ width: "10%" }}></div>
              <div className="bg-red-500 h-full" style={{ width: "5%" }}></div>
            </div>
            <div className="flex justify-between text-xs mt-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                GET (65%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                POST (20%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                PUT (10%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                DELETE (5%)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Traffic by Content Type</CardTitle>
          <CardDescription>Data transfer by response content type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {networkMetrics.trafficByContentType.map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        i === 0 ? "bg-blue-500" : i === 1 ? "bg-green-500" : i === 2 ? "bg-yellow-500" : "bg-gray-500"
                      }`}
                    ></span>
                    <span className="font-medium">{item.type}</span>
                  </div>
                  <span className="text-sm">
                    {item.size} ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      i === 0 ? "bg-blue-500" : i === 1 ? "bg-green-500" : i === 2 ? "bg-yellow-500" : "bg-gray-500"
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-4">
            <h3 className="text-sm font-medium">Network Traffic Over Time</h3>
            <div className="h-60 w-full bg-slate-50 rounded-md border p-4 flex items-end">
              {/* Mock line chart - would be replaced with actual chart component */}
              <div className="relative w-full h-full flex items-end justify-between">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="relative h-full flex-1 mx-0.5">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-blue-400"
                      style={{ height: `${20 + Math.sin(i / 3) * 15 + Math.random() * 30}%` }}
                    ></div>
                  </div>
                ))}
                <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                  Traffic chart (last 24 hours)
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { cn } from "frontend/lib/utils";

export const CardTraffic = ({ className }: { className?: string }) => {
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
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Traffic by Content Type</CardTitle>
        <CardDescription>Data transfer by response content type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {networkMetrics.trafficByContentType.map((item, i) => (
            <div key={item.type} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      // eslint-disable-next-line no-nested-ternary
                      i === 0 ? "bg-blue-500" : i === 1 ? "bg-green-500" : i === 2 ? "bg-yellow-500" : "bg-gray-500"
                    }`}
                  />
                  <span className="font-medium">{item.type}</span>
                </div>
                <span className="text-sm">
                  {item.size} ({item.percentage}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    // eslint-disable-next-line no-nested-ternary
                    i === 0 ? "bg-blue-500" : i === 1 ? "bg-green-500" : i === 2 ? "bg-yellow-500" : "bg-gray-500"
                  }`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

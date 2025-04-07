import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { Progress } from "frontend/components/ui/progress";
import { cn } from "frontend/lib/utils";

export const CardNetwork = ({ className }: { className?: string }) => {
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

  const successRate = 90;

  return (
    <Card className={cn(className)}>
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
            <p className="text-sm text-muted-foreground">Success</p>
            <p className="text-2xl font-bold">{successRate}</p>
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
        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span>Success rate</span>
            <span>{successRate.toFixed(1)}%</span>
          </div>
          <Progress value={successRate} className="h-2" />
        </div>
        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span>Caching rate</span>
            <span>{successRate.toFixed(1)}%</span>
          </div>
          <Progress value={successRate} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};

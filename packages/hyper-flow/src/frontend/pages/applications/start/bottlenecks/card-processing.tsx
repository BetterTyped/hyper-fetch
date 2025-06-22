import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatTime } from "@/utils/format";

export const CardProcessing = ({ className }: { className?: string }) => {
  // Mock data for bottlenecks
  const bottlenecks = {
    processingIssues: [
      {
        id: "issue-1",
        endpoint: "/api/products/recommendations",
        issue: "High data processing time",
        impact: "Slow response time",
        severity: "high",
        processingTime: 320,
        networkTime: 210,
        recommendation: "Consider implementing server-side pagination",
      },
      {
        id: "issue-2",
        endpoint: "/api/analytics/dashboard",
        issue: "Heavy data transformation",
        impact: "Increased CPU usage",
        severity: "medium",
        processingTime: 260,
        networkTime: 160,
        recommendation: "Optimize data transformation or move computation to server",
      },
      {
        id: "issue-3",
        endpoint: "/api/users/search",
        issue: "Inefficient filtering",
        impact: "UI freezes during filtering",
        severity: "medium",
        processingTime: 180,
        networkTime: 130,
        recommendation: "Implement debouncing for search input",
      },
    ],
    networkIssues: [
      {
        id: "network-1",
        endpoint: "/api/images/gallery",
        issue: "Large payload size",
        impact: "Slow initial load",
        severity: "high",
        size: "3.4 MB",
        recommendation: "Implement image compression and lazy loading",
      },
      {
        id: "network-2",
        endpoint: "/api/feed",
        issue: "Frequent polling",
        impact: "Increased bandwidth usage",
        severity: "medium",
        frequency: "Every 5 seconds",
        recommendation: "Consider using WebSockets for real-time updates",
      },
    ],
    codeOptimizations: [
      "Replace multiple sequential requests with batch operations",
      "Implement request deduplication for frequently accessed resources",
      "Add proper error handling and retries for intermittent failures",
      "Optimize the size of request payloads by removing unnecessary fields",
    ],
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Processing Bottlenecks</CardTitle>
        <CardDescription>Issues with data processing in your application</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Endpoint</TableHead>
              <TableHead>Issue</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Processing Time</TableHead>
              <TableHead>Recommendation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bottlenecks.processingIssues.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell className="font-medium">{issue.endpoint}</TableCell>
                <TableCell>{issue.issue}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      // eslint-disable-next-line no-nested-ternary
                      issue.severity === "high"
                        ? "bg-red-100 text-red-800 hover:bg-red-100"
                        : issue.severity === "medium"
                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                          : "bg-green-100 text-green-800 hover:bg-green-100"
                    }
                  >
                    {issue.severity}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Processing: {formatTime(issue.processingTime)}</span>
                      <span>Network: {formatTime(issue.networkTime)}</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-red-400"
                        style={{
                          width: `${(issue.processingTime / (issue.processingTime + issue.networkTime)) * 100}%`,
                        }}
                      />
                      <div
                        className="h-full bg-blue-400"
                        style={{
                          width: `${(issue.networkTime / (issue.processingTime + issue.networkTime)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{issue.recommendation}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

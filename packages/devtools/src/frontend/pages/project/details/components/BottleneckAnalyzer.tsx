import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { Progress } from "frontend/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "frontend/components/ui/table";
import { Badge } from "frontend/components/ui/badge";
import { Button } from "frontend/components/ui/button";

interface BottleneckAnalyzerProps {
  project: any;
}

export const BottleneckAnalyzer = ({ project }: BottleneckAnalyzerProps) => {
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
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Request Patterns</CardTitle>
          <CardDescription>Analysis of your application&apos;s request patterns over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-gray-900 rounded-md border flex flex-col items-center">
              <p className="text-sm font-medium text-muted-foreground">Most used request</p>
              <p className="text-lg font-bold mt-1">/api/products</p>
              <p className="text-xs text-muted-foreground mt-1">245 calls</p>
            </div>

            <div className="p-3 bg-gray-900 rounded-md border flex flex-col items-center">
              <p className="text-sm font-medium text-muted-foreground">Slowest request</p>
              <p className="text-lg font-bold mt-1">/api/checkout/process</p>
              <p className="text-xs text-muted-foreground mt-1">450 ms avg</p>
            </div>

            <div className="p-3 bg-gray-900 rounded-md border flex flex-col items-center">
              <p className="text-sm font-medium text-muted-foreground">Error rate</p>
              <p className="text-lg font-bold mt-1">8.3%</p>
              <p className="text-xs text-muted-foreground mt-1">5 errors in last hour</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
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
                        <span>Processing: {issue.processingTime}ms</span>
                        <span>Network: {issue.networkTime}ms</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
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

      <Card>
        <CardHeader>
          <CardTitle>Network Bottlenecks</CardTitle>
          <CardDescription>Issues with network requests and data transfer</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Recommendation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bottlenecks.networkIssues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell className="font-medium">{issue.endpoint}</TableCell>
                  <TableCell>{issue.issue}</TableCell>
                  <TableCell>
                    <Badge
                      className={
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
                    {issue.size ? `Size: ${issue.size}` : issue.frequency ? `Frequency: ${issue.frequency}` : ""}
                  </TableCell>
                  <TableCell className="text-sm">{issue.recommendation}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Overall Health</CardTitle>
            <CardDescription>Current performance status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Processing efficiency</span>
                <span className="text-sm font-medium">72%</span>
              </div>
              <Progress value={72} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Network optimization</span>
                <span className="text-sm font-medium">65%</span>
              </div>
              <Progress value={65} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Cache efficiency</span>
                <span className="text-sm font-medium">78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>

            <div className="p-3 bg-blue-50 rounded-md border border-blue-200 text-sm text-blue-800 mt-4">
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
                Addressing identified bottlenecks could improve overall performance by ~35%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Code Optimization Recommendations</CardTitle>
            <CardDescription>Suggestions to improve request handling</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {bottlenecks.codeOptimizations.map((tip, index) => (
                <li key={`tip-${index}`} className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Button variant="outline" className="w-full">
                Generate Detailed Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

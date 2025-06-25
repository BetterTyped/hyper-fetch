import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const CardRecommended = ({ className }: { className?: string }) => {
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
        <CardTitle>Code Optimization Recommendations</CardTitle>
        <CardDescription>Suggestions to improve request handling</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {bottlenecks.codeOptimizations.map((tip, index) => (
            // eslint-disable-next-line react/no-array-index-key
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
  );
};

/* eslint-disable react/no-array-index-key */
import { useMemo } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { Progress } from "frontend/components/ui/progress";
import { ProjectOverview } from "./ProjectOverview";
import { Project } from "frontend/store/projects.store";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { EmptyBox } from "frontend/components/ui/empty-box";

// Function to determine className based on method
const getMethodClassNames = (method: string): string => {
  switch (method) {
    case "GET":
      return "bg-blue-100 text-blue-800";
    case "POST":
      return "bg-green-100 text-green-800";
    case "PUT":
      return "bg-yellow-100 text-yellow-800";
    case "DELETE":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const General = ({ project }: { project: Project }) => {
  const {
    state: { requests, failed, success },
  } = useDevtools();

  const recentRequests = requests.slice(0, 4);
  const totalRequests = requests.length;
  const failedRequests = failed.length;
  const successRequests = success.length;

  const successRate = totalRequests > 0 ? Math.min(100, (successRequests / totalRequests) * 100) : 0;

  // Calculate average response time
  const avgResponseTime =
    requests.length > 0
      ? requests
          .slice(0, 20)
          .filter((req) => req.response)
          .reduce((sum, req) => sum + (req.response!.responseTimestamp - req.response!.requestTimestamp), 0) /
        requests.slice(0, 20).length
      : 0;

  // Calculate request distribution by method
  const methodCounts = requests.reduce(
    (acc, req) => {
      const { method } = req.request;
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Group errors by status code or type
  const errorsByStatus = failed.reduce(
    (acc, req) => {
      const status = req.response?.status || "Unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Get most frequent error
  const mostFrequentError = Object.entries(errorsByStatus).sort((a, b) => b[1] - a[1])[0] || ["None", 0];

  // Find commonly used patterns in endpoints
  const endpointPatterns = useMemo(() => {
    const patterns: Record<string, number> = {};

    requests.forEach((req) => {
      // Extract path pattern (replace IDs with placeholders)
      const { endpoint } = req.request;
      const patternized = endpoint
        .replace(/\/[0-9a-f]{24}\b/g, "/:id") // MongoDB ObjectIds
        .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, "/:uuid") // UUIDs
        .replace(/\/\d+\b/g, "/:number"); // Simple numeric IDs

      patterns[patternized] = (patterns[patternized] || 0) + 1;
    });

    return Object.entries(patterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5 patterns
  }, [requests]);

  // Detect potential request chains (requests happening within 500ms of each other)
  const requestChains = useMemo(() => {
    const chains: Array<{ id: string; requests: Array<(typeof requests)[0]> }> = [];
    const sortedRequests = [...requests].sort((a, b) => a.triggerTimestamp - b.triggerTimestamp);

    let currentChain: Array<(typeof requests)[0]> = [];

    sortedRequests.forEach((req, i) => {
      if (i === 0 || req.triggerTimestamp - sortedRequests[i - 1].triggerTimestamp > 500) {
        // Start new chain
        if (currentChain.length > 0) {
          chains.push({ id: `chain-${Date.now()}-${chains.length}`, requests: [...currentChain] });
        }
        currentChain = [req];
      } else {
        // Add to current chain
        currentChain.push(req);
      }
    });

    // Add last chain
    if (currentChain.length > 0) {
      chains.push({ id: `chain-${Date.now()}-${chains.length}`, requests: [...currentChain] });
    }

    return chains.filter((chain) => chain.requests.length > 1).slice(0, 3); // Show only chains with multiple requests
  }, [requests]);

  // Generate troubleshooting tips based on request patterns
  // const troubleshootingTips = useMemo(() => {
  //   const tips: Array<{ id: string; title: string; description: string; severity: "low" | "medium" | "high" }> = [];

  //   // Check for high failure rate
  //   const failureRate = totalRequests > 0 ? failedRequests / totalRequests : 0;
  //   if (failureRate > 0.2 && totalRequests > 5) {
  //     tips.push({
  //       id: "high-failure",
  //       title: "High Failure Rate Detected",
  //       description: `Your application has a ${(failureRate * 100).toFixed(1)}% failure rate. Check common error patterns.`,
  //       severity: failureRate > 0.5 ? "high" : "medium",
  //     });
  //   }

  //   // Check for slow endpoints
  //   const slowRequests = requests.filter((req) =>
  //     req.responseTimestamp && req.triggerTimestamp ? req.responseTimestamp - req.triggerTimestamp > 1000 : false,
  //   );

  //   if (slowRequests.length > 3) {
  //     tips.push({
  //       id: "slow-endpoints",
  //       title: "Slow Endpoints Detected",
  //       description: `${slowRequests.length} requests took more than 1s to complete. Consider optimizing or adding loading states.`,
  //       severity: "medium",
  //     });
  //   }

  //   // Check for error patterns
  //   const errorKeys = Object.keys(errorsByStatus);
  //   if (errorKeys.includes("401") || errorKeys.includes("403")) {
  //     tips.push({
  //       id: "auth-issues",
  //       title: "Authentication Issues",
  //       description: "Multiple auth-related errors detected. Check user session and token validity.",
  //       severity: "high",
  //     });
  //   }

  //   return tips;
  // }, [requests, totalRequests, failedRequests, errorsByStatus]);

  // Analyze unique endpoint coverage
  // const endpointCoverage = useMemo(() => {
  //   const uniqueEndpoints = new Set<string>();
  //   const endpointMethods = new Map<string, Set<string>>();

  //   requests.forEach((req) => {
  //     const endpoint = req.request.endpoint;
  //     const method = req.request.method;

  //     uniqueEndpoints.add(endpoint);

  //     if (!endpointMethods.has(endpoint)) {
  //       endpointMethods.set(endpoint, new Set());
  //     }
  //     endpointMethods.get(endpoint)?.add(method);
  //   });

  //   // Calculate endpoints with multiple methods vs single method
  //   const multiMethodEndpoints = [...endpointMethods.entries()].filter(([_, methods]) => methods.size > 1).length;

  //   const singleMethodEndpoints = uniqueEndpoints.size - multiMethodEndpoints;

  //   return {
  //     uniqueCount: uniqueEndpoints.size,
  //     multiMethodCount: multiMethodEndpoints,
  //     singleMethodCount: singleMethodEndpoints,
  //     coverage: uniqueEndpoints.size > 0 ? (multiMethodEndpoints / uniqueEndpoints.size) * 100 : 0,
  //   };
  // }, [requests]);

  // Analyze request relationships (auth flow, data loading patterns, etc.)
  // const contextPatterns = useMemo(() => {
  //   // Look for auth flow patterns
  //   const hasAuthFlow = requests.some(
  //     (req) =>
  //       req.request.endpoint.includes("/auth") ||
  //       req.request.endpoint.includes("/login") ||
  //       req.request.endpoint.includes("/token"),
  //   );

  //   // Look for data validation patterns (POST followed by GET)
  //   const validationPatterns = [];
  //   for (let i = 1; i < requests.length; i++) {
  //     const prev = requests[i - 1];
  //     const curr = requests[i];

  //     if (
  //       prev.request.method === "POST" &&
  //       curr.request.method === "GET" &&
  //       curr.triggerTimestamp - prev.triggerTimestamp < 1000 &&
  //       curr.request.endpoint.startsWith(prev.request.endpoint.split("/").slice(0, -1).join("/"))
  //     ) {
  //       validationPatterns.push({
  //         write: prev.request.endpoint,
  //         read: curr.request.endpoint,
  //       });
  //     }
  //   }

  //   // Look for CRUD patterns
  //   const resourceAccesses = requests.reduce(
  //     (acc, req) => {
  //       // Extract resource name from endpoint (e.g., /api/users/123 -> users)
  //       const parts = req.request.endpoint.split("/").filter(Boolean);
  //       if (parts.length >= 1) {
  //         const resource = parts[parts.length > 2 ? 1 : 0];

  //         if (!acc[resource]) {
  //           acc[resource] = { resource, methods: new Set() };
  //         }

  //         acc[resource].methods.add(req.request.method);
  //       }
  //       return acc;
  //     },
  //     {} as Record<string, { resource: string; methods: Set<string> }>,
  //   );

  //   const resourcesWithFullCRUD = Object.values(resourceAccesses)
  //     .filter((r) => {
  //       const methods = Array.from(r.methods);
  //       return (
  //         methods.includes("GET") &&
  //         (methods.includes("POST") || methods.includes("PUT") || methods.includes("PATCH")) &&
  //         methods.includes("DELETE")
  //       );
  //     })
  //     .map((r) => r.resource);

  //   return {
  //     hasAuthFlow,
  //     validationPatterns: validationPatterns.slice(0, 3),
  //     resourcesWithFullCRUD,
  //   };
  // }, [requests]);

  return (
    <div className="flex flex-col gap-4">
      <ProjectOverview project={project} />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Active Requests</CardTitle>
            <CardDescription>Real-time view of current requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success requests</p>
                <p className="text-3xl font-bold">{successRequests}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed requests</p>
                <p className="text-3xl font-bold">{failedRequests}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Success rate</span>
                <span>{successRate.toFixed(1)}%</span>
              </div>
              <Progress value={successRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <>
            <CardHeader>
              <CardTitle>Recent Requests</CardTitle>
              <CardDescription>Last few requests processed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRequests.length === 0 ? (
                  <EmptyBox title="Waiting for API activity" />
                ) : (
                  recentRequests.map((item) => (
                    <div key={item.requestId} className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${item.isSuccess ? "bg-green-500" : "bg-red-500"}`} />
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getMethodClassNames(item.request.method)}`}
                      >
                        {item.request.method}
                      </span>
                      <span className="text-sm font-medium truncate flex-1">{item.request.endpoint}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.triggerTimestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Response time and request information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Response Time</p>
                <p className="text-3xl font-bold">{(avgResponseTime / 1000).toFixed(2)}s</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-3xl font-bold">{totalRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Request Distribution</CardTitle>
            <CardDescription>Breakdown by HTTP method</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!Object.entries(methodCounts).length && <EmptyBox title="No API requests recorded yet" />}
              {Object.entries(methodCounts).map(([method, count]) => (
                <div key={method} className="flex items-center gap-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getMethodClassNames(method)}`}>
                    {method}
                  </span>
                  <div className="flex-1">
                    <Progress value={totalRequests > 0 ? (count / totalRequests) * 100 : 0} className="h-2" />
                  </div>
                  <span className="text-sm font-medium">
                    {count} ({totalRequests > 0 ? ((count / totalRequests) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Error Summary</CardTitle>
            <CardDescription>Common errors and issues</CardDescription>
          </CardHeader>
          <CardContent>
            {failed.length === 0 ? (
              <EmptyBox title="No errors detected - Looking good!" />
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Most frequent error</p>
                  <p className="text-xl font-bold">
                    Status {mostFrequentError[0]}: {mostFrequentError[1]} occurrences
                  </p>
                </div>
                <div className="space-y-2">
                  {Object.entries(errorsByStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="text-sm font-medium">Status {status}</span>
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>API Usage Patterns</CardTitle>
            <CardDescription>Common endpoint patterns detected in your application</CardDescription>
          </CardHeader>
          <CardContent>
            {endpointPatterns.length === 0 ? (
              <EmptyBox title="Analyzing API usage patterns..." />
            ) : (
              <div className="space-y-4">
                {endpointPatterns.map(([pattern, count]) => (
                  <div key={pattern} className="p-3 border rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm">{pattern}</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{count} requests</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {count > 10 ? "High usage pattern" : "Normal usage pattern"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Request Chains</CardTitle>
            <CardDescription>Sequences of related API calls detected in your application</CardDescription>
          </CardHeader>
          <CardContent>
            {requestChains.length === 0 ? (
              <EmptyBox title="No request sequences detected yet" />
            ) : (
              <div className="space-y-6">
                {requestChains.map((chain) => (
                  <div key={chain.id} className="space-y-2">
                    <p className="text-sm font-medium">Chain of {chain.requests.length} requests</p>
                    <div className="flex flex-col gap-2">
                      {chain.requests.map((req, i) => (
                        <div key={req.requestId} className="flex items-center gap-2">
                          <div className="flex flex-col items-center">
                            <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                              {i + 1}
                            </span>
                            {i < chain.requests.length - 1 && <div className="w-0.5 h-3 bg-gray-200/20" />}
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${getMethodClassNames(req.request.method)}`}
                          >
                            {req.request.method}
                          </span>
                          <span className="text-sm font-medium truncate flex-1">{req.request.endpoint}</span>
                          <span className="text-xs">{req.isSuccess ? "✓" : "✗"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        {/* 
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Request Context Intelligence</CardTitle>
            <CardDescription>Smart analysis of your API usage patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {contextPatterns.hasAuthFlow && (
                <div className="p-3 border rounded-md bg-blue-50">
                  <h4 className="text-sm font-bold">Authentication Flow Detected</h4>
                  <p className="text-xs mt-1 text-muted-foreground">
                    Your application uses authentication endpoints. Consider monitoring token refresh patterns.
                  </p>
                </div>
              )}

              {contextPatterns.validationPatterns.length > 0 && (
                <div className="p-3 border rounded-md">
                  <h4 className="text-sm font-bold">Write-then-Read Pattern Detected</h4>
                  <div className="mt-2 space-y-2">
                    {contextPatterns.validationPatterns.map((pattern, i) => (
                      <div key={i} className="text-xs">
                        <span className="px-1 py-0.5 bg-green-100 rounded">POST</span>
                        <span className="mx-1 text-muted-foreground">{pattern.write}</span>
                        <span className="mx-1">→</span>
                        <span className="px-1 py-0.5 bg-blue-100 rounded">GET</span>
                        <span className="mx-1 text-muted-foreground">{pattern.read}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {contextPatterns.resourcesWithFullCRUD.length > 0 && (
                <div className="p-3 border rounded-md">
                  <h4 className="text-sm font-bold">Full CRUD Resources</h4>
                  <p className="text-xs mt-1 mb-2 text-muted-foreground">
                    These resources have complete Create, Read, Update, Delete operations:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {contextPatterns.resourcesWithFullCRUD.map((resource) => (
                      <span key={resource} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                        {resource}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!contextPatterns.hasAuthFlow &&
                contextPatterns.validationPatterns.length === 0 &&
                contextPatterns.resourcesWithFullCRUD.length === 0 && (
                  <EmptyBox title="Monitoring API behavior patterns..." />
                )}
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
};

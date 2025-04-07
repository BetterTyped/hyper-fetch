import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { cn } from "frontend/lib/utils";

export const CardOverview = ({ className }: { className?: string }) => {
  return (
    <Card className={cn(className)}>
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
  );
};

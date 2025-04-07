import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { Progress } from "frontend/components/ui/progress";
import { cn } from "frontend/lib/utils";

export const CardHealth = ({ className }: { className?: string }) => {
  return (
    <Card className={cn(className)}>
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
  );
};

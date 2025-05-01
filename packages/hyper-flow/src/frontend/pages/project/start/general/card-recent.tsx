import { useShallow } from "zustand/react/shallow";
import { Clock, ArrowRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "frontend/components/ui/table";
import { EmptyState } from "frontend/components/no-content/empty-state";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { useNetworkStore } from "frontend/store/project/network.store";
import { cn } from "frontend/lib/utils";
import { RequestRow } from "../../network/list/request-row/request-row";
import { Link } from "frontend/routing/router";
import { Button } from "frontend/components/ui/button";

export const CardRecent = ({ className }: { className?: string }) => {
  const { project } = useDevtools();

  const { requests } = useNetworkStore(
    useShallow((state) => ({
      requests: state.projects[project.name].requests,
    })),
  );

  return (
    <Card className={cn(className)}>
      <>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Requests
            </CardTitle>
            <Button variant="secondary" size="sm" asChild>
              <Link to="project.network" params={{ projectName: project.name }}>
                View All Requests
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <CardDescription>Last few requests processed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.length === 0 ? (
              <EmptyState title="Waiting for API activity" description="No requests processed yet" />
            ) : (
              <Table className="w-full h-full" wrapperClassName="pb-4">
                <TableHeader className={cn(!requests.length && "opacity-40", "sticky top-0 z-10")}>
                  <TableRow>
                    <TableHead />
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Cache</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Response time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="relative pb-8">
                  {requests.slice(0, 8).map((item) => (
                    <RequestRow key={item.requestId} item={item} clickable={false} />
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </>
    </Card>
  );
};

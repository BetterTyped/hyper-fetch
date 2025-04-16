import { useShallow } from "zustand/react/shallow";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { useNetworkStore } from "frontend/store/project/network.store";
import { EmptyState } from "frontend/components/ui/empty-state";
import { cn } from "frontend/lib/utils";
import { RequestRow } from "../../network/list/request-row/request-row";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "frontend/components/ui/table";

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
          <CardTitle>Recent Requests</CardTitle>
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
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Success</TableHead>
                    <TableHead>Cached</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="relative pb-8">
                  {requests.slice(0, 5).map((item) => (
                    <RequestRow key={item.requestId} item={item} />
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

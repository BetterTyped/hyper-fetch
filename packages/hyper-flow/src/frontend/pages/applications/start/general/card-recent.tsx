import { useShallow } from "zustand/react/shallow";
import { Clock, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { RequestRow } from "../../network/list/request-row/request-row";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/no-content/empty-state";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { useNetworkStore } from "@/store/applications/network.store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const CardRecent = ({ className }: { className?: string }) => {
  const { application } = useDevtools();

  const { requests } = useNetworkStore(
    useShallow((state) => ({
      requests: state.applications[application.name].requests,
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
              <Link to="/applications/$applicationName/network" params={{ applicationName: application.name }}>
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

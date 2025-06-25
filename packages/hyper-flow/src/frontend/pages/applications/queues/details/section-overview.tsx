import { QueueDataType } from "@hyper-fetch/core";
import { Ban, CircleCheck, FileWarning, Loader, ScanEye } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { useQueueStatsStore } from "@/store/applications/queue-stats.store";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { Badge } from "@/components/ui/badge";

export const SectionOverview = ({ item }: { item: QueueDataType }) => {
  const { application } = useDevtools();
  const queueStats = useQueueStatsStore(useShallow((state) => state.applications[application.name]));

  const stats = queueStats?.stats.get(item.queryKey);

  return (
    <div>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="flex items-center gap-2 h-11 text-muted-foreground">
              <ScanEye className="w-5 h-5" />
              Processed Requests:
            </TableCell>
            <TableCell>
              <Badge variant="secondary">
                {stats?.totalRequests} request{stats?.totalRequests === 1 ? "" : "s"}
              </Badge>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="flex items-center gap-2 h-11 text-muted-foreground">
              <CircleCheck className="w-5 h-5" />
              Successful Requests:
            </TableCell>
            <TableCell>
              <Badge variant={stats?.totalRequestsSuccess ? "success" : "secondary"}>
                {stats?.totalRequestsSuccess} request{stats?.totalRequestsSuccess === 1 ? "" : "s"}
              </Badge>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="flex items-center gap-2 h-11 text-muted-foreground">
              <FileWarning className="w-5 h-5" />
              Failed Requests:
            </TableCell>
            <TableCell>
              <Badge variant={stats?.totalRequestsFailed ? "destructive" : "secondary"}>
                {stats?.totalRequestsFailed} request{stats?.totalRequestsFailed === 1 ? "" : "s"}
              </Badge>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="flex items-center gap-2 h-11 text-muted-foreground">
              <Ban className="w-5 h-5" />
              Canceled Requests:
            </TableCell>
            <TableCell>
              <Badge variant={stats?.totalRequestsCanceled ? "warning" : "secondary"}>
                {stats?.totalRequestsCanceled} request{stats?.totalRequestsCanceled === 1 ? "" : "s"}
              </Badge>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="flex items-center gap-2 h-11 text-muted-foreground">
              <Loader className="w-5 h-5" />
              Pending Requests:
            </TableCell>
            <TableCell>
              <Badge variant={item.requests.length > 0 ? "info" : "secondary"}>
                {item.requests.length} request{item.requests.length === 1 ? "" : "s"}
              </Badge>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

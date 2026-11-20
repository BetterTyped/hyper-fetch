import type { QueueDataType } from "@hyper-fetch/core";
import { Ban, CircleCheck, FileWarning, Loader, ScanEye } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { useQueueStatsStore } from "@/store/applications/queue-stats.store";

export const SectionOverview = ({ item }: { item: QueueDataType }) => {
  const { application } = useDevtools();
  const queueStats = useQueueStatsStore(useShallow((state) => state.applications[application.name]));

  // A queue is listed as soon as its first request is added, the stats only once a request finishes
  const stats = queueStats?.stats.get(item.queryKey);
  const total = stats?.totalRequests ?? 0;
  const success = stats?.totalRequestsSuccess ?? 0;
  const failed = stats?.totalRequestsFailed ?? 0;
  const canceled = stats?.totalRequestsCanceled ?? 0;

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
                {total} request{total === 1 ? "" : "s"}
              </Badge>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="flex items-center gap-2 h-11 text-muted-foreground">
              <CircleCheck className="w-5 h-5" />
              Successful Requests:
            </TableCell>
            <TableCell>
              <Badge variant={success ? "success" : "secondary"}>
                {success} request{success === 1 ? "" : "s"}
              </Badge>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="flex items-center gap-2 h-11 text-muted-foreground">
              <FileWarning className="w-5 h-5" />
              Failed Requests:
            </TableCell>
            <TableCell>
              <Badge variant={failed ? "destructive" : "secondary"}>
                {failed} request{failed === 1 ? "" : "s"}
              </Badge>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="flex items-center gap-2 h-11 text-muted-foreground">
              <Ban className="w-5 h-5" />
              Canceled Requests:
            </TableCell>
            <TableCell>
              <Badge variant={canceled ? "warning" : "secondary"}>
                {canceled} request{canceled === 1 ? "" : "s"}
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

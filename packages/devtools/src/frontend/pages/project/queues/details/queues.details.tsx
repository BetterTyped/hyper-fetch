import { useMemo } from "react";
import { useQueue } from "@hyper-fetch/react";
import { ListX, Pause, Play } from "lucide-react";
import { Request } from "@hyper-fetch/core";
import { useShallow } from "zustand/react/shallow";

import { Back } from "./back/back";
import { Separator } from "frontend/components/ui/separator";
import { Button } from "frontend/components/ui/button";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "frontend/components/ui/collapsible";
import { Table, TableBody, TableCell, TableRow } from "frontend/components/ui/table";
import { Badge } from "frontend/components/ui/badge";
import { Key } from "frontend/components/ui/key";
import { Bar } from "frontend/components/bar/bar";
import { ResizableSidebar } from "frontend/components/ui/resizable-sidebar";
import { getQueueStatus, QueueStatus } from "frontend/utils/queue.status.utils";
import { useQueueStore } from "frontend/store/project/queue.store";
import { useQueueStatsStore } from "frontend/store/project/queue-stats.store";
import { initialNetworkStats } from "frontend/store/project/network-stats.store";

const RowInfo = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <TableRow>
    <TableCell className="font-medium">{label}</TableCell>
    <TableCell>{value}</TableCell>
  </TableRow>
);

export const QueuesDetails = () => {
  const { project, client } = useDevtools();
  const { queues, detailsQueryKey } = useQueueStore((state) => state.projects[project.name]);
  const { stats } = useQueueStatsStore(useShallow((state) => state.projects[project.name] || {}));

  const item = detailsQueryKey ? queues.get(detailsQueryKey) : null;
  const itemStats = (detailsQueryKey ? stats?.get(detailsQueryKey) : null) || initialNetworkStats;

  const status = item ? getQueueStatus(item) : QueueStatus.PENDING;

  const dummyRequest = useMemo(() => {
    return new Request(client, {
      endpoint: "",
      queryKey: item?.queryKey,
      method: item?.queryKey.split("_")[0],
    });
  }, [client, item?.queryKey]);

  const { start, stop, stopped, requests, dispatcher } = useQueue(dummyRequest);

  const { color } = useMemo(() => {
    const statusColor = (
      {
        Pending: "gray",
        Running: "blue",
        Stopped: "orange",
      } as const
    )[status];

    return {
      status,
      color: statusColor,
    };
  }, [status]);

  const toggleQueue = () => {
    if (stopped) {
      start();
    } else {
      stop();
    }
  };

  const clear = () => {
    if (item) {
      dispatcher.cancelRunningRequests(item.queryKey);
      dispatcher.clearQueue(item.queryKey);
    }
  };

  // TODO NO CONTENT
  if (!item) return null;

  return (
    <ResizableSidebar
      position="right"
      className="absolute flex flex-col top-0 right-0 bottom-0 border-l border-light-400 dark:border-dark-400"
      defaultSize={{
        width: "70%",
      }}
      minWidth="400px"
      maxWidth="100%"
      minHeight="100%"
      maxHeight="100%"
    >
      <Bar style={{ flexWrap: "nowrap", justifyContent: "flex-start" }}>
        <Back />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <Key value={item.queryKey} type="queue" />
        <Badge variant={color === "gray" ? "secondary" : "default"}>{status}</Badge>
        <div className="flex-1" />
      </Bar>
      <div className="overflow-y-auto">
        <div className="p-2.5">
          <Table>
            <TableBody>
              <RowInfo label="Total Requests:" value={<Badge variant="secondary">{itemStats.totalRequests}</Badge>} />
              <RowInfo
                label="Success Requests:"
                value={<Badge variant="default">{itemStats.totalRequestsSuccess}</Badge>}
              />
              <RowInfo
                label="Failed Requests:"
                value={<Badge variant="destructive">{itemStats.totalRequestsFailed}</Badge>}
              />
              <RowInfo
                label="Canceled Requests:"
                value={<Badge variant="secondary">{itemStats.totalRequestsCanceled}</Badge>}
              />
              <RowInfo label="In Progress Requests:" value={<Badge>{item.requests.length}</Badge>} />
            </TableBody>
          </Table>
          <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 pt-1.5">
            <Button variant={stopped ? "default" : "secondary"} onClick={toggleQueue}>
              {stopped ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
              {stopped ? "Play" : "Stop"}
            </Button>
            <Button variant="outline" disabled={!requests.length} onClick={clear}>
              <ListX className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>

        <Collapsible defaultOpen>
          <CollapsibleTrigger className="w-full p-2 hover:bg-accent">Response times</CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-2.5">
              <Table>
                <TableBody>
                  <RowInfo
                    label="Last response time:"
                    value={<Badge>{parseInt(String(itemStats.latestResponseTime), 10)}ms</Badge>}
                  />
                  <RowInfo
                    label="Min response time:"
                    value={<Badge>{parseInt(String(itemStats.lowestResponseTime), 10)}ms</Badge>}
                  />
                  <RowInfo
                    label="Max response time:"
                    value={<Badge>{parseInt(String(itemStats.highestResponseTime), 10)}ms</Badge>}
                  />
                  <RowInfo
                    label="Average response time:"
                    value={<Badge>{parseInt(String(itemStats.avgResponseTime), 10)}ms</Badge>}
                  />
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="w-full p-2 hover:bg-accent">Processing times</CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-2.5">
              <Table>
                <TableBody>
                  <RowInfo
                    label="Last pre-processing time:"
                    value={<Badge>{parseInt(String(itemStats.latestProcessingTime), 10)}ms</Badge>}
                  />
                  <RowInfo
                    label="Min pre-processing time:"
                    value={<Badge>{parseInt(String(itemStats.lowestProcessingTime), 10)}ms</Badge>}
                  />
                  <RowInfo
                    label="Max pre-processing time:"
                    value={<Badge>{parseInt(String(itemStats.highestProcessingTime), 10)}ms</Badge>}
                  />
                  <RowInfo
                    label="Average pre-processing time:"
                    value={<Badge>{parseInt(String(itemStats.avgProcessingTime), 10)}ms</Badge>}
                  />
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="w-full p-2 hover:bg-accent">Queue times</CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-2.5">
              <Table>
                <TableBody>
                  <RowInfo
                    label="Last queue time:"
                    value={<Badge>{parseInt(String(itemStats.avgQueueTime), 10)}ms</Badge>}
                  />
                  <RowInfo
                    label="Min time spent in queue:"
                    value={<Badge>{parseInt(String(itemStats.lowestQueueTime), 10)}ms</Badge>}
                  />
                  <RowInfo
                    label="Max time spent in queue:"
                    value={<Badge>{parseInt(String(itemStats.highestQueueTime), 10)}ms</Badge>}
                  />
                  <RowInfo
                    label="Average time spent in queue:"
                    value={<Badge>{parseInt(String(itemStats.avgQueueTime), 10)}ms</Badge>}
                  />
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </ResizableSidebar>
  );
};

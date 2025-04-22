import { useShallow } from "zustand/react/shallow";

import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "frontend/components/ui/collapsible";
import { Table, TableBody, TableCell, TableRow } from "frontend/components/ui/table";
import { Badge } from "frontend/components/ui/badge";
import { ResizableSidebar } from "frontend/components/ui/resizable-sidebar";
import { useQueueStore } from "frontend/store/project/queue.store";
import { useQueueStatsStore } from "frontend/store/project/queue-stats.store";
import { initialNetworkStats } from "frontend/store/project/network-stats.store";
import { SectionHead } from "./section-head";
import { SectionToolbar } from "./section-toolbar";

const RowInfo = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <TableRow>
    <TableCell className="font-medium">{label}</TableCell>
    <TableCell>{value}</TableCell>
  </TableRow>
);

export const QueuesDetails = () => {
  const { project } = useDevtools();
  const { queues, detailsId } = useQueueStore(useShallow((state) => state.projects[project.name]));
  const queueStats = useQueueStatsStore(useShallow((state) => state.projects[project.name]));

  const item = detailsId ? queues.get(detailsId) : null;
  const itemStats = (detailsId ? queueStats?.stats?.get(detailsId) : null) || initialNetworkStats;

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
      <div className="max-h-full flex flex-col">
        <div className="px-4">
          <SectionToolbar item={item} />
          <SectionHead item={item} />
        </div>
      </div>
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

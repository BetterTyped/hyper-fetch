import { useEffect, useState } from "react";
import { QueueDataType } from "@hyper-fetch/core";
import { useShallow } from "zustand/react/shallow";

import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { useQueueStatsStore } from "frontend/store/project/queue-stats.store";
import { formatBytes, formatTime } from "frontend/utils/format";
import { cn } from "frontend/lib/utils";
import { useResizableSidebar } from "frontend/components/ui/resizable-sidebar";

const StatBlock = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-gray-500/20 rounded-lg p-4 shadow-sm">
    <h3 className="text-sm font-medium text-gray-200 mb-2">{title}</h3>
    <div className="space-y-2">{children}</div>
  </div>
);

const StatItem = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-gray-400">{label}</span>
    <span className="text-sm font-medium text-gray-200">{value}</span>
  </div>
);

export const SectionData = ({ item }: { item: QueueDataType }) => {
  const { project } = useDevtools();
  const queueStats = useQueueStatsStore(useShallow((state) => state.projects[project.name]));
  const stats = queueStats?.stats.get(item.queryKey);

  const { breakpoint } = useResizableSidebar();
  const [grid, setGrid] = useState<string>("grid-cols-3");

  useEffect(() => {
    if (breakpoint.name === "xs") {
      setGrid("grid-cols-1");
    } else if (breakpoint.name === "sm") {
      setGrid("grid-cols-2");
    } else if (breakpoint.name === "md") {
      setGrid("grid-cols-3");
    }
  }, [breakpoint]);

  if (!stats) return null;

  return (
    <div className="space-y-4 my-4">
      <div className={cn("grid gap-4", grid)}>
        <StatBlock title="Request Overview">
          <StatItem label="Total Requests" value={stats.totalRequests} />
          <StatItem
            label="Success Rate"
            value={`${Math.round((stats.totalRequestsSuccess / stats.totalRequests) * 100)}%`}
          />
          <StatItem label="Cached Requests" value={stats.totalCachedRequests} />
          <StatItem label="Non-Cached Requests" value={stats.totalNonCachedRequests} />
        </StatBlock>

        <StatBlock title="Response Times">
          <StatItem label="Average" value={formatTime(stats.avgResponseTime)} />
          <StatItem label="Fastest" value={formatTime(stats.lowestResponseTime)} />
          <StatItem label="Slowest" value={formatTime(stats.highestResponseTime)} />
          <StatItem label="Latest" value={formatTime(stats.latestResponseTime)} />
        </StatBlock>

        <StatBlock title="Data Transfer">
          <StatItem label="Total Payload" value={formatBytes(stats.totalTransferredPayload)} />
          <StatItem label="Total Response" value={formatBytes(stats.totalTransferredResponse)} />
          <StatItem label="Avg Payload" value={formatBytes(stats.avgPayloadSize)} />
          <StatItem label="Avg Response" value={formatBytes(stats.avgResponseSize)} />
        </StatBlock>

        <StatBlock title="Queue Performance">
          <StatItem label="Avg Queue Time" value={formatTime(stats.avgQueueTime)} />
          <StatItem label="Min Queue Time" value={formatTime(stats.lowestQueueTime)} />
          <StatItem label="Max Queue Time" value={formatTime(stats.highestQueueTime)} />
          <StatItem label="Latest Queue Time" value={formatTime(stats.latestQueueTime)} />
        </StatBlock>

        <StatBlock title="Processing Times">
          <StatItem label="Average" value={formatTime(stats.avgProcessingTime)} />
          <StatItem label="Fastest" value={formatTime(stats.lowestProcessingTime)} />
          <StatItem label="Slowest" value={formatTime(stats.highestProcessingTime)} />
          <StatItem label="Latest" value={formatTime(stats.latestProcessingTime)} />
        </StatBlock>

        <StatBlock title="Request Status">
          <StatItem label="Loading" value={stats.totalRequestsLoading} />
          <StatItem label="Success" value={stats.totalRequestsSuccess} />
          <StatItem label="Failed" value={stats.totalRequestsFailed} />
          <StatItem label="Canceled" value={stats.totalRequestsCanceled} />
        </StatBlock>
      </div>
    </div>
  );
};

import { useEffect, useState } from "react";
import { QueueDataType } from "@hyper-fetch/core";
import { useShallow } from "zustand/react/shallow";
import { motion } from "framer-motion";
import { Activity, Clock, Database, GaugeCircle, Timer, AlertCircle } from "lucide-react";

import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { useQueueStatsStore } from "@/store/applications/queue-stats.store";
import { formatBytes, formatTime } from "@/utils/format";
import { cn } from "@/lib/utils";
import { useResizableSidebar } from "@/components/ui/resizable-sidebar";

const StatBlock = ({
  title,
  children,
  icon: Icon,
}: {
  title: string;
  children: React.ReactNode;
  icon: React.ElementType;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-gradient-to-br from-zinc-700/30 to-zinc-800/30 rounded-xl p-6 shadow-lg border border-zinc-600/30 hover:border-zinc-500/50 transition-all duration-300"
  >
    <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
      <Icon className="w-4 h-4 text-blue-400" />
      {title}
    </h3>
    <div className="space-y-3">{children}</div>
  </motion.div>
);

const StatItem = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between items-center group">
    <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">{label}</span>
    <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">{value}</span>
  </div>
);

export const SectionData = ({ item }: { item: QueueDataType }) => {
  const { application } = useDevtools();
  const queueStats = useQueueStatsStore(useShallow((state) => state.applications[application.name]));
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
        <StatBlock title="Request Overview" icon={Activity}>
          <StatItem label="Total Requests" value={stats.totalRequests} />
          <StatItem
            label="Success Rate"
            value={`${Math.round((stats.totalRequestsSuccess / stats.totalRequests) * 100)}%`}
          />
          <StatItem label="Cached Requests" value={stats.totalCachedRequests} />
          <StatItem label="Non-Cached Requests" value={stats.totalNonCachedRequests} />
        </StatBlock>

        <StatBlock title="Response Times" icon={Timer}>
          <StatItem label="Average" value={formatTime(stats.avgResponseTime)} />
          <StatItem label="Fastest" value={formatTime(stats.lowestResponseTime)} />
          <StatItem label="Slowest" value={formatTime(stats.highestResponseTime)} />
          <StatItem label="Latest" value={formatTime(stats.latestResponseTime)} />
        </StatBlock>

        <StatBlock title="Data Transfer" icon={Database}>
          <StatItem label="Total Payload" value={formatBytes(stats.totalTransferredPayload)} />
          <StatItem label="Total Response" value={formatBytes(stats.totalTransferredResponse)} />
          <StatItem label="Avg Payload" value={formatBytes(stats.avgPayloadSize)} />
          <StatItem label="Avg Response" value={formatBytes(stats.avgResponseSize)} />
        </StatBlock>

        <StatBlock title="Queue Performance" icon={Clock}>
          <StatItem label="Avg Queue Time" value={formatTime(stats.avgQueueTime)} />
          <StatItem label="Min Queue Time" value={formatTime(stats.lowestQueueTime)} />
          <StatItem label="Max Queue Time" value={formatTime(stats.highestQueueTime)} />
          <StatItem label="Latest Queue Time" value={formatTime(stats.latestQueueTime)} />
        </StatBlock>

        <StatBlock title="Processing Times" icon={GaugeCircle}>
          <StatItem label="Average" value={formatTime(stats.avgProcessingTime)} />
          <StatItem label="Fastest" value={formatTime(stats.lowestProcessingTime)} />
          <StatItem label="Slowest" value={formatTime(stats.highestProcessingTime)} />
          <StatItem label="Latest" value={formatTime(stats.latestProcessingTime)} />
        </StatBlock>

        <StatBlock title="Request Status" icon={AlertCircle}>
          <StatItem label="Total" value={stats.totalRequests} />
          <StatItem label="Success" value={stats.totalRequestsSuccess} />
          <StatItem label="Failed" value={stats.totalRequestsFailed} />
          <StatItem label="Canceled" value={stats.totalRequestsCanceled} />
        </StatBlock>
      </div>
    </div>
  );
};

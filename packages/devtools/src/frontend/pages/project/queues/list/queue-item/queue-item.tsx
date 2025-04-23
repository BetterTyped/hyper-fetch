import { CpuIcon } from "lucide-react";
import { QueueDataType } from "@hyper-fetch/core";
import { useShallow } from "zustand/react/shallow";

import { getQueueStatus, getQueueStatusColor } from "frontend/utils/queue.status.utils";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { Key } from "frontend/components/ui/key";
import { Chip } from "frontend/components/ui/chip";
import { useQueueStore } from "frontend/store/project/queue.store";
import { useQueueStatsStore } from "frontend/store/project/queue-stats.store";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "frontend/components/ui/card";
import { cn } from "frontend/lib/utils";

export const Item = ({ queue }: { queue: QueueDataType }) => {
  const status = getQueueStatus(queue);
  const { project } = useDevtools();
  const { detailsQueueKey, openDetails } = useQueueStore(
    useShallow((state) => ({
      detailsQueueKey: state.projects[project.name].detailsId,
      openDetails: state.openDetails,
    })),
  );
  const queueStats = useQueueStatsStore(useShallow((state) => state.projects[project.name]?.stats.get(queue.queryKey)));

  const statusColor = (
    {
      Pending: "gray",
      Running: "blue",
      Stopped: "orange",
    } as const
  )[status];

  const total = queueStats?.totalRequests || 0;
  const isActive = detailsQueueKey === queue.queryKey && !queue.stopped;
  const color = getQueueStatusColor({ queue, active: isActive });

  return (
    <Card
      role="button"
      className={cn(
        "gap-2 hover:bg-gray-800 cursor-pointer overflow-visible",
        color.border,
        isActive && "ring-inset ring-2 ring-cyan-400",
      )}
      onClick={() => openDetails(project.name, queue.queryKey)}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-1">
          <CpuIcon className="w-[22px] h-[22px] stroke-gray-500" />
          Queue
        </CardTitle>
        <Chip color={statusColor}>{status}</Chip>
      </CardHeader>
      <CardContent>
        <span className="text-[28px] font-bold mr-1.5 text-light-900 dark:text-light-100">{queue.requests.length}</span>
        <span>Active request{queue.requests.length === 1 ? "" : "s"}</span>
        <div className="-mt-1.5 mb-2.5 text-cyan-400 dark:text-cyan-500 font-normal text-xs flex">
          (<strong className="mr-[3px]">{total} </strong> in total)
        </div>
      </CardContent>
      <CardFooter>
        <Key className="text-xs" type="query" value={queue.queryKey} />
      </CardFooter>
    </Card>
  );
};

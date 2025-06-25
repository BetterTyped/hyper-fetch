import { QueueDataType } from "@hyper-fetch/core";
import { useShallow } from "zustand/react/shallow";

import { getQueueStatus, getQueueStatusColor } from "@/utils/queue.status.utils";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { Key } from "@/components/ui/key";
import { Chip } from "@/components/ui/chip";
import { useQueueStore } from "@/store/applications/queue.store";
import { useQueueStatsStore } from "@/store/applications/queue-stats.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Item = ({ queue }: { queue: QueueDataType }) => {
  const { application } = useDevtools();
  const { detailsQueryKey, openDetails } = useQueueStore(
    useShallow((state) => ({
      detailsQueryKey: state.applications[application.name].detailsId,
      openDetails: state.openDetails,
    })),
  );
  const queueStats = useQueueStatsStore(
    useShallow((state) => state.applications[application.name]?.stats.get(queue.queryKey)),
  );

  const status = getQueueStatus(queue);
  const statusColor = (
    {
      Pending: "gray",
      Running: "blue",
      Stopped: "orange",
    } as const
  )[status];

  const total = queueStats?.totalRequests || 0;
  const isActive = detailsQueryKey === queue.queryKey && !queue.stopped;
  const color = getQueueStatusColor({ queue, active: isActive });

  return (
    <Card
      role="button"
      className={cn(
        "gap-2 hover:bg-zinc-800 cursor-pointer overflow-visible",
        color.border,
        isActive && "ring-inset ring-2 ring-cyan-400",
      )}
      onClick={() => openDetails(application.name, queue.queryKey)}
    >
      <CardHeader className="grid grid-cols-4 items-center justify-between gap-3 max-w-full">
        <CardTitle className="flex items-center gap-1 col-span-3">
          <Key className="text-xs" type="query" value={queue.queryKey} />
        </CardTitle>
        <Chip className="col-span-1" color={statusColor}>
          {status}
        </Chip>
      </CardHeader>
      <CardContent>
        <span className="text-[28px] font-bold mr-1.5 text-light-900 dark:text-light-100">{queue.requests.length}</span>
        <span>Active request{queue.requests.length === 1 ? "" : "s"}</span>
        <div className="-mt-1.5 mb-2.5 text-cyan-400 dark:text-cyan-500 font-normal text-xs flex">
          (<strong className="mr-[3px]">{total} </strong> in total)
        </div>
      </CardContent>
    </Card>
  );
};

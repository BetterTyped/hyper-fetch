import { CpuIcon } from "lucide-react";
import { QueueDataType } from "@hyper-fetch/core";

import { getQueueStatus, getQueueStatusColor } from "frontend/utils/queue.status.utils";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { Key } from "frontend/components/ui/key";
import { Chip } from "frontend/components/ui/chip";

export const Card = ({ queue }: { queue: QueueDataType }) => {
  const status = getQueueStatus(queue);
  const {
    state: { stats, detailsQueueKey },
    setDetailsQueueKey,
  } = useDevtools();

  const statusColor = (
    {
      Pending: "gray",
      Running: "blue",
      Stopped: "orange",
    } as const
  )[status];

  const total = (stats[queue.queryKey]?.total || 0) + queue.requests.length;

  return (
    <button
      type="button"
      color={getQueueStatusColor({ queue, active: detailsQueueKey === queue.queryKey && !queue.stopped })}
      onClick={() => setDetailsQueueKey(queue.queryKey)}
    >
      <div className="flex justify-between w-full gap-4 mb-1.5">
        <div className="flex items-center gap-1 text-sm font-bold">
          <CpuIcon className="w-[22px] h-[22px] stroke-gray-500" />
          Queue
        </div>
        <Chip color={statusColor}>{status}</Chip>
      </div>
      <div className="text-xs font-medium">
        <span className="text-[28px] font-bold mr-1.5 text-light-900 dark:text-light-100">{queue.requests.length}</span>
        <span>Active request{queue.requests.length === 1 ? "" : "s"}</span>
      </div>
      <div className="text-left mt-1.5 text-xs font-medium max-w-[180px]">
        <div className="-mt-1.5 mb-2.5 text-cyan-400 dark:text-cyan-500 font-normal text-xs flex">
          (<strong className="mr-[3px]">{total} </strong> in total)
        </div>
        <Key className="text-xs" type="queue" value={queue.queryKey} />
      </div>
    </button>
  );
};

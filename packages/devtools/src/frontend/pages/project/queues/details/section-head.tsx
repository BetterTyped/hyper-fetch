import { useMemo } from "react";
import { QueueDataType, RequestInstance } from "@hyper-fetch/core";

import { Badge } from "frontend/components/ui/badge";
import { Key } from "frontend/components/ui/key";
import { QueueStatus, getQueueStatus } from "frontend/utils/queue.status.utils";

export const SectionHead = ({ item }: { item: QueueDataType<RequestInstance> }) => {
  const status = item ? getQueueStatus(item) : QueueStatus.PENDING;
  const color = useMemo(() => {
    switch (status) {
      case QueueStatus.RUNNING:
        return "success";
      case QueueStatus.PENDING:
        return "secondary";
      default:
        return "destructive";
    }
  }, [status]);

  return (
    <div className="flex flex-row items-center gap-3 my-3 px-2">
      <Key value={item.queryKey} type="query" className="text-2xl" />
      <div className="flex-1" />
      <Badge variant={color}>{status}</Badge>
    </div>
  );
};

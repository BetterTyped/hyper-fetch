import { QueueDataType } from "@hyper-fetch/core";

export enum QueueStatus {
  PENDING = "Pending",
  RUNNING = "Running",
  STOPPED = "Stopped",
}

export const getQueueStatus = (queue: QueueDataType): QueueStatus => {
  if (queue.stopped) {
    return QueueStatus.STOPPED;
  }
  if (queue.requests.length) {
    return QueueStatus.RUNNING;
  }
  return QueueStatus.PENDING;
};

export const getQueueStatusColor = ({ queue, active }: { queue: QueueDataType; active: boolean }) => {
  if (active) {
    return { border: "border-blue-500" };
  }
  if (queue.stopped) {
    return { border: "border-orange-500" };
  }
  if (queue.requests.length) {
    return { border: "border-cyan-500" };
  }
  return { border: "border-zinc-700" };
};

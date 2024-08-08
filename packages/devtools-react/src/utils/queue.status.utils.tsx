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

export const getQueueStatusColor = (queue: QueueDataType, alpha: number, useBlack?: boolean): string => {
  if (queue.stopped) {
    return `rgba(255, 152, 0, ${alpha})`;
  }
  if (queue.requests.length) {
    return `rgba(88, 196, 220, ${alpha})`;
  }
  if (useBlack) {
    return `rgba(0, 0, 0, ${alpha})`;
  }
  return `rgba(61, 66, 74, ${alpha})`;
};

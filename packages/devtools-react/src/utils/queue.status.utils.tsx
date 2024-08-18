import { QueueDataType } from "@hyper-fetch/core";

import { tokens } from "theme/tokens";

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

export const getQueueStatusColor = ({
  isLight,
  queue,
  alpha,
  custom,
}: {
  isLight: boolean;
  queue: QueueDataType;
  alpha: string;
  custom?: string;
}): string => {
  if (queue.stopped) {
    return isLight ? tokens.colors.orange[400] + alpha : tokens.colors.orange[500] + alpha;
  }
  if (queue.requests.length) {
    return isLight ? tokens.colors.cyan[400] + alpha : tokens.colors.cyan[400] + alpha;
  }
  if (custom) {
    return custom + alpha;
  }
  return isLight ? tokens.colors.light[400] + alpha : tokens.colors.dark[400] + alpha;
};

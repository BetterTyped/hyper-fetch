import { ClientInstance } from "@hyper-fetch/core";
import { DocsCard } from "@site/src/components/ui/docs-card";

import { ProgressBar } from "./progress-bar";
import { QueueStatusIcon } from "./queue-status-icon";
import { ItemType } from "./events";

export const RequestEvent = ({
  client,
  queueRequest,
  stopped,
}: {
  client: ClientInstance;
  queueRequest: ItemType;
  stopped: boolean;
}) => {
  let status = "Pending";
  let color = "#A1A1AA";
  const uploading = queueRequest.uploading?.progress ?? 0;
  const downloading = queueRequest.downloading?.progress ?? 0;
  const progress = (uploading + downloading) / 2;
  const fetchRunningRequests = client.fetchDispatcher.getRunningRequests(queueRequest.request.queryKey);
  const submitRunningRequests = client.submitDispatcher.getRunningRequests(queueRequest.request.queryKey);

  const isRunningInFetchQueue = fetchRunningRequests.some(({ requestId }) => requestId === queueRequest.requestId);
  const isRunningInSubmitQueue = submitRunningRequests.some(({ requestId }) => requestId === queueRequest.requestId);
  const isRunning = isRunningInFetchQueue || isRunningInSubmitQueue;

  const isOffline = !client.appManager.isOnline;
  // Queue or single request can be stopped
  const isStopped = queueRequest.stopped || stopped;

  if (queueRequest.canceled) {
    status = "Canceled";
    color = "#FBBF24";
  } else if (queueRequest.removed) {
    status = "Removed";
    color = "#8e8e8e";
  } else if (queueRequest.failed) {
    status = "Failed";
    color = "#F87171";
  } else if (progress === 100) {
    status = "Completed";
    color = "#22C55E";
  } else if (isStopped && !isRunning) {
    status = "Stopped";
    color = "#8e8e8e";
  } else if (isOffline && !isRunning) {
    status = "Offline";
    color = "#8e8e8e";
  } else if (progress < 50) {
    status = "Uploading";
    color = "#38BDF8";
  } else {
    status = "Downloading";
    color = "#21ade9";
  }

  return (
    <DocsCard
      hover={false}
      className="p-2 px-4 flex flex-col gap-0.5 shadow-lg border-2 border-zinc-200 dark:border-zinc-700"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <QueueStatusIcon status={status} />
        </span>
        <div className="flex-1">
          <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-base truncate">
            {queueRequest.request.endpoint}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">{status}</div>
        </div>
        <div className="text-xs font-mono text-zinc-400 min-w-[32px] text-right">
          {progress > 0 ? `${progress.toFixed(0)}%` : "-"}
        </div>
      </div>
      <div className="pb-2">
        <ProgressBar progress={progress} color={color} />
      </div>
    </DocsCard>
  );
};

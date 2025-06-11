import { memo } from "react";
import { useQueue } from "@hyper-fetch/react";
import { ClientInstance, RequestInstance } from "@hyper-fetch/core";
import { DocsCard } from "@site/src/components/ui/docs-card";

import { ProgressBar } from "./progress-bar";
import { QueueStatusIcon } from "./queue-status-icon";
import { ItemType } from "./events";

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function formatTime(ms: number | null): string {
  if (ms === null || Number.isNaN(ms)) return "--";
  if (ms < 0) return "0s";
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function ProgressDetails({ label, progress, color }: { label: string; progress: any; color?: string }) {
  const percent = progress?.progress ?? 0;
  const timeLeft = progress?.timeLeft ?? null;
  const sizeLeft = progress?.sizeLeft ?? 0;
  const total = progress?.total ?? 0;
  const loaded = progress?.loaded ?? 0;

  return (
    <div className="flex flex-col">
      <span className="!text-zinc-100 mb-2 !text-sm font-semibold">{label}</span>
      <div>
        <ProgressBar progress={percent} color={percent === 100 ? undefined : color} />
      </div>

      <div className="grid grid-cols-5 gap-2 mt-3">
        <div className="flex flex-col items-start">
          <span className="text-xs !text-zinc-400">Loaded</span>
          <span className="text-xs font-bold text-zinc-100">{formatBytes(loaded)}</span>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs !text-zinc-400">Total</span>
          <span className="text-xs font-bold text-zinc-100">{formatBytes(total)}</span>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs !text-zinc-400">Left</span>
          <span className="text-xs font-bold text-zinc-100">{formatBytes(sizeLeft)}</span>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs !text-zinc-400">ETA</span>
          <span className="text-xs font-bold text-zinc-100">{formatTime(timeLeft)}</span>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs !text-zinc-400">Progress</span>
          <span className="text-xs font-bold text-zinc-100">{Math.round(percent)}%</span>
        </div>
      </div>
    </div>
  );
}

const RequestLifecycle = ({
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
    <DocsCard hover={false} className="p-4 flex flex-col gap-4 shadow-lg border-2 border-zinc-200 dark:border-zinc-700">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <QueueStatusIcon status={status} />
        </span>
        <div className="flex-1">
          <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg truncate">
            {queueRequest.request.endpoint}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">{status}</div>
        </div>
        <div className="text-xs font-mono text-zinc-400 min-w-[32px] text-right">
          {progress > 0 ? `${progress.toFixed(0)}%` : "-"}
        </div>
      </div>
      <div className="grid">
        {/* <ProgressDetails label="Upload progress" progress={queueRequest.uploading} color={color} /> */}
        {/* <div className="h-px bg-zinc-200 dark:bg-zinc-700 my-4" /> */}
        <ProgressDetails label="Download progress" progress={queueRequest.downloading} color={color} />
      </div>
    </DocsCard>
  );
};

export const RequestsLifecycle = memo(
  ({
    request,
    dispatcherType = "auto",
  }: {
    request: RequestInstance;
    dispatcherType?: "fetch" | "submit" | "auto";
  }) => {
    const { requests } = useQueue(request, { keepFinishedRequests: true, dispatcherType });

    return (
      <div className="flex flex-col gap-4">
        {requests.map((req) => (
          <RequestLifecycle key={req.requestId} client={request.client} queueRequest={req} stopped={false} />
        ))}
      </div>
    );
  },
);

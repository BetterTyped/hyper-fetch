import { useEffect, useState } from "react";
import { useQueue } from "@hyper-fetch/react";
import { ClientInstance, RequestInstance } from "@hyper-fetch/core";
import { DocsCard } from "@site/src/components/ui/docs-card";

import { TinyLoader } from "./tiny-loader";
import { Pause } from "lucide-react";

const ProgressBar = ({ progress, color = "#38BDF8" }: { progress: number; color?: string }) => {
  return (
    <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mt-1">
      <div className="h-full rounded-full" style={{ width: `${progress}%`, background: color }} />
      {/* {progress} */}
    </div>
  );
};

const QueueStatusIcon = ({ status }: { status: string }) => {
  if (status === "Uploading" || status === "Downloading") {
    return <TinyLoader />;
  }
  if (status === "Stopped") {
    return <Pause className="w-4 h-4 text-white" />;
  }
  if (status === "Completed") {
    return (
      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (status === "Failed" || status === "Canceled") {
    return (
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
        <line x1="6" y1="18" x2="18" y2="6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
};

const Queue = ({ request }: { request: RequestInstance }) => {
  const { requests, stopped } = useQueue(request, {
    keepFinishedRequests: true,
  });

  return (
    <div className="flex flex-col gap-3">
      {requests.map((queueRequest) => {
        let status = "Pending";
        let color = "#A1A1AA";
        const uploading = queueRequest.uploading?.progress ?? 0;
        const downloading = queueRequest.downloading?.progress ?? 0;
        const progress = (uploading + downloading) / 2;
        const fetchRunningRequests = queueRequest.request.client.fetchDispatcher.getAllRunningRequests();
        const submitRunningRequests = queueRequest.request.client.submitDispatcher.getAllRunningRequests();

        const isRunningInFetchQueue = fetchRunningRequests.some(
          ({ requestId }) => requestId === queueRequest.requestId,
        );
        const isRunningInSubmitQueue = submitRunningRequests.some(
          ({ requestId }) => requestId === queueRequest.requestId,
        );
        const isRunning = isRunningInFetchQueue || isRunningInSubmitQueue;

        // Type-safe status detection:
        // - 'Canceled' if stopped and not resolved
        // - 'Failed' if resolved but not completed (progress < 100)
        // - 'Completed' if progress === 100
        // - Otherwise, uploading/downloading
        if (queueRequest.canceled) {
          status = "Canceled";
          color = "#FBBF24";
        } else if (queueRequest.removed) {
          status = "Removed";
          color = "#8e8e8e";
        } else if (stopped && !isRunning) {
          status = "Stopped";
          color = "#8e8e8e";
        } else if (queueRequest.failed) {
          status = "Failed";
          color = "#F87171";
        } else if (progress === 100) {
          status = "Completed";
          color = "#22C55E";
        } else if (progress < 50) {
          status = "Uploading";
          color = "#38BDF8";
        } else {
          status = "Downloading";
          color = "#21ade9";
        }

        return (
          <DocsCard
            key={queueRequest.requestId}
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
      })}
    </div>
  );
};

export const ClientRequests = ({ client }: { client: ClientInstance }) => {
  const [queueRequests, setQueueRequests] = useState<RequestInstance[]>([]);

  useEffect(() => {
    const unmountFetch = client.fetchDispatcher.events.onQueueChange((queue) => {
      setQueueRequests((prevState) => {
        if (prevState.some((request) => request.queryKey === queue.queryKey)) {
          return prevState;
        }
        // Ensure we're only adding RequestInstance objects to the array
        const requestToAdd = queue.requests[0].request;
        return [...prevState, requestToAdd];
      });
    });
    const unmountSubmit = client.fetchDispatcher.events.onQueueChange((queue) => {
      setQueueRequests((prevState) => {
        if (prevState.some((request) => request.queryKey === queue.queryKey)) {
          return prevState;
        }
        // Ensure we're only adding RequestInstance objects to the array
        const requestToAdd = queue.requests[0].request;
        return [...prevState, requestToAdd];
      });
    });

    return () => {
      unmountFetch();
      unmountSubmit();
    };
  }, [client]);

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <h3 className="text-zinc-900 dark:text-zinc-100 text-lg font-semibold">Requests:</h3>
      {queueRequests.length === 0 ? (
        <div className="text-zinc-400 text-center">No requests queues detected.</div>
      ) : (
        queueRequests.map((queueRequest) => <Queue key={queueRequest.cacheKey} request={queueRequest} />)
      )}
    </div>
  );
};

/* eslint-disable react/no-array-index-key */
import React, { useCallback, useEffect, useState } from "react";
import { QueueRequest } from "@hyper-fetch/react";
import { AnimatePresence } from "motion/react";
import { AppWindowMac } from "lucide-react";
import { ClientInstance, QueueDataType, QueueItemType, RequestInstance } from "@hyper-fetch/core";
import { useToast } from "@site/src/hooks/use-toast";
import { AnimatedListItem } from "@site/src/components/ui/animated-list-item";

import { RequestEvent } from "./request-event";
import { QueueEvent } from "./queue-event";
import { AppEvent } from "./app-event";
import { MessageEvent } from "./message-event";

interface QueueProps {
  client: ClientInstance;
}

export type EventType =
  | {
      type: "fetch-queue";
      name: string;
      timestamp: number;
    }
  | {
      type: "submit-queue";
      name: string;
      timestamp: number;
    }
  | {
      type: "app";
      name: string;
      timestamp: number;
    }
  | {
      type: "request";
      name: string;
      timestamp: number;
    };

const canUpdate = (
  item: Pick<QueueRequest<RequestInstance>, "success" | "failed" | "canceled" | "removed" | "resolved">,
) => {
  if (item.success || (item.failed && !item.canceled)) {
    return false;
  }
  return true;
};

export type ItemType = Omit<
  QueueRequest<RequestInstance>,
  "stopRequest" | "startRequest" | "deleteRequest" | "pauseRequest"
>;

export const Events: React.FC<QueueProps> = ({ client }) => {
  const [requests, setRequests] = useState<ItemType[]>([]);
  const [stopped, setStopped] = useState<Record<string, boolean>>({});

  const { toast } = useToast();

  const createRequestsArray = useCallback(
    (queueElements: QueueItemType<RequestInstance>[], prevRequests?: ItemType[]): ItemType[] => {
      const newRequests = queueElements
        // Keep only unique requests
        .filter((el) => !prevRequests?.some((prevEl) => prevEl.requestId === el.requestId))
        .map<ItemType>((req) => ({
          failed: false,
          canceled: false,
          removed: false,
          success: false,
          ...req,
          downloading: {
            progress: 0,
            timeLeft: 0,
            sizeLeft: 0,
            total: 0,
            loaded: 0,
            startTimestamp: 0,
          },
          uploading: {
            progress: 0,
            timeLeft: 0,
            sizeLeft: 0,
            total: 0,
            loaded: 0,
            startTimestamp: 0,
          },
        }));

      return [...prevRequests, ...newRequests];
    },
    [],
  );

  const updateQueueState = useCallback(
    (values: QueueDataType<RequestInstance>) => {
      setStopped((prev) => ({ ...prev, [values.queryKey]: values.stopped }));
      setRequests((prev) => createRequestsArray(values.requests, prev));
    },
    [createRequestsArray],
  );

  const mergePayloadType = useCallback((requestId: string, data: Partial<ItemType>) => {
    setRequests((prev) =>
      prev.map((el) => {
        if (el.requestId === requestId && canUpdate(el)) {
          return {
            ...el,
            ...data,
          };
        }

        return el;
      }),
    );
  }, []);

  useEffect(() => {
    const unmountFetch = client.fetchDispatcher.events.onQueueStatusChange((queue) => {
      const timestamp = Date.now();
      const hasRunningRequests = client.fetchDispatcher.hasRunningRequests(queue.queryKey);
      const stoppedStatus = hasRunningRequests ? "Paused" : "Stopped";
      const event = {
        type: "fetch-queue",
        name: queue.stopped ? stoppedStatus : "Running",
        timestamp,
      } as const;
      toast({
        message: <QueueEvent event={event} />,
      });
    });
    const unmountSubmit = client.submitDispatcher.events.onQueueStatusChange((queue) => {
      const timestamp = Date.now();
      const hasRunningRequests = client.submitDispatcher.hasRunningRequests(queue.queryKey);
      const stoppedStatus = hasRunningRequests ? "Paused" : "Stopped";
      const event = {
        type: "fetch-queue",
        name: queue.stopped ? stoppedStatus : "Running",
        timestamp,
      } as const;
      toast({
        message: <QueueEvent event={event} />,
      });
    });

    const unmountApp = client.appManager.events.onOnline(() => {
      const event = {
        type: "app",
        name: "Online",
        timestamp: Date.now(),
      } as const;
      toast({
        message: <AppEvent event={event} />,
      });
    });

    const unmountOffline = client.appManager.events.onOffline(() => {
      const event = {
        type: "app",
        name: "Offline",
        timestamp: Date.now(),
      } as const;
      toast({
        message: <AppEvent event={event} />,
      });
    });

    const unmountFetchChange = client.fetchDispatcher.events.onQueueChange<RequestInstance>(updateQueueState);
    const unmountFetchStatus = client.fetchDispatcher.events.onQueueStatusChange<RequestInstance>(updateQueueState);
    const unmountSubmitChange = client.submitDispatcher.events.onQueueChange<RequestInstance>(updateQueueState);
    const unmountSubmitStatus = client.submitDispatcher.events.onQueueStatusChange<RequestInstance>(updateQueueState);

    const unmountDeduplicated = client.requestManager.events.onDeduplicated(({ request }) => {
      toast({
        message: (
          <MessageEvent
            name="New request deduplicated"
            message={`Deduplicated with ongoing "${request.endpoint}" request`}
          />
        ),
      });
    });
    const unmountStart = client.requestManager.events.onRequestStart(({ requestId }) => {
      setRequests((prev) =>
        prev.map((el) =>
          el.requestId === requestId ? { ...el, failed: false, success: false, canceled: false, removed: false } : el,
        ),
      );
    });
    const unmountFailed = client.requestManager.events.onResponse(({ requestId, response, details }) => {
      if (!response.success) {
        setRequests((prev) =>
          prev.map((el) => (el.requestId === requestId ? { ...el, failed: true, canceled: details.isCanceled } : el)),
        );
      } else {
        setRequests((prev) => prev.map((el) => (el.requestId === requestId ? { ...el, success: true } : el)));
      }
    });

    const unmountRemoved = client.requestManager.events.onRemove(({ requestId }) => {
      setRequests((prev) =>
        prev.map((el) => (el.requestId === requestId && canUpdate(el) ? { ...el, removed: true } : el)),
      );
    });

    const unmountDownload = client.requestManager.events.onDownloadProgress(
      ({ progress, timeLeft, sizeLeft, total, loaded, startTimestamp, requestId }) => {
        mergePayloadType(requestId, { downloading: { progress, timeLeft, sizeLeft, total, loaded, startTimestamp } });
      },
    );

    const unmountUpload = client.requestManager.events.onUploadProgress(
      ({ progress, timeLeft, sizeLeft, total, loaded, startTimestamp, requestId }) => {
        mergePayloadType(requestId, { uploading: { progress, timeLeft, sizeLeft, total, loaded, startTimestamp } });
      },
    );

    return () => {
      unmountDeduplicated();
      unmountFetch();
      unmountSubmit();
      unmountApp();
      unmountOffline();
      unmountFetchStatus();
      unmountFetchChange();
      unmountSubmitStatus();
      unmountSubmitChange();
      unmountDownload();
      unmountUpload();
      unmountStart();
      unmountFailed();
      unmountRemoved();
    };
  }, [
    client.fetchDispatcher,
    client.submitDispatcher,
    client.appManager,
    client.requestManager.events,
    updateQueueState,
    mergePayloadType,
  ]);

  return (
    <div className="flex flex-col gap-3">
      {!requests.length && (
        <div className="!text-zinc-400 font-medium flex items-center gap-2">
          <AppWindowMac />
          No requests yet
        </div>
      )}
      <AnimatePresence>
        {requests.map((event) => {
          return (
            <AnimatedListItem key={event.requestId}>
              <RequestEvent client={client} queueRequest={event} stopped={stopped[event.request.queryKey]} />
            </AnimatedListItem>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

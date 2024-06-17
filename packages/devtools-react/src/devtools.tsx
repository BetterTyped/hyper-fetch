import { useCallback, useEffect, useState } from "react";
import { ClientInstance, QueueDataType } from "@hyper-fetch/core";

import { Header } from "./components/header/header";
import { Cache } from "./pages/cache/cache";
import { Logs } from "./pages/logs/logs";
import { Network } from "./pages/network/network";
import { Processing } from "./pages/processing/processing";
import { DevtoolsProvider } from "devtools.context";
import { DevtoolsModule, RequestEvent, RequestResponse } from "devtools.types";

const modules = {
  Network,
  Cache,
  Logs,
  Processing,
};

export type DevtoolsProps<T extends ClientInstance> = {
  client: T;
};

export const Devtools = <T extends ClientInstance>({ client }: DevtoolsProps<T>) => {
  const [module, setModule] = useState(DevtoolsModule.NETWORK);

  const Component = modules[module];

  const [requests, setRequests] = useState<RequestEvent<T>[]>([]);
  const [success, setSuccess] = useState<RequestResponse<T>[]>([]);
  const [failed, setFailed] = useState<RequestResponse<T>[]>([]);
  const [inProgress, setInProgress] = useState<RequestEvent<T>[]>([]);
  const [paused, setPaused] = useState<RequestEvent<T>[]>([]);
  const [canceled, setCanceled] = useState<RequestEvent<T>[]>([]);

  const countProgressRequests = useCallback(() => {
    const fetchRequests = client.fetchDispatcher.getAllRunningRequest();
    const submitRequests = client.submitDispatcher.getAllRunningRequest();

    const allQueuedRequest: RequestEvent<T>[] = [...fetchRequests, ...submitRequests].map((item) => {
      return {
        requestId: item.requestId,
        request: item.request,
      } as RequestEvent<T>;
    });

    const fetchQueues = Array.from(
      client.fetchDispatcher.storage.entries() as unknown as Array<[string, QueueDataType]>,
    ).map(([, value]) => value);
    const submitQueues = Array.from(
      client.submitDispatcher.storage.entries() as unknown as Array<[string, QueueDataType]>,
    ).map(([, value]) => value);

    const pausedRequests: RequestEvent<T>[] = [...fetchQueues, ...submitQueues].reduce((acc, queue) => {
      if (queue.stopped) {
        return [
          ...acc,
          ...queue.requests.map((item) => {
            return {
              requestId: item.requestId,
              request: item.request,
            };
          }),
        ] as RequestEvent<T>[];
      }

      queue.requests.forEach((item) => {
        if (item.stopped) {
          acc.push({
            requestId: item.requestId,
            request: item.request,
          } as RequestEvent<T>);
        }
      });

      return acc;
    }, [] as RequestEvent<T>[]);

    setInProgress(allQueuedRequest);
    setPaused(pausedRequests);
  }, [client.fetchDispatcher, client.submitDispatcher]);

  useEffect(() => {
    const unmountOnRequestStart = client.requestManager.events.onRequestStart((details) => {
      setRequests((prev) => [...prev, details] as RequestEvent<T>[]);
      countProgressRequests();
    });

    const unmountOnResponse = client.requestManager.events.onResponse(({ response, details, request, requestId }) => {
      countProgressRequests();

      if (response.success) {
        setSuccess((prev) => [...prev, { response, details, request, requestId }] as RequestResponse<T>[]);
      } else {
        setFailed((prev) => [...prev, { response, details, request, requestId }] as RequestResponse<T>[]);
      }
    });

    const unmountOnRequestPause = client.requestManager.events.onAbort((details) => {
      setCanceled((prev) => [...prev, details] as RequestEvent<T>[]);

      countProgressRequests();
    });
    const unmountOnFetchQueueChange = client.fetchDispatcher.events.onQueueStatusChange(() => {
      countProgressRequests();
    });
    const unmountOnSubmitQueueChange = client.submitDispatcher.events.onQueueStatusChange(() => {
      countProgressRequests();
    });
    const unmountOnRemove = client.requestManager.events.onRemove(() => {
      countProgressRequests();
    });

    return () => {
      unmountOnResponse();
      unmountOnRequestStart();
      unmountOnRequestPause();
      unmountOnFetchQueueChange();
      unmountOnSubmitQueueChange();
      unmountOnRemove();
    };
  }, [client, countProgressRequests]);

  const allRequests = requests.map((item) => {
    const isCanceled = !!canceled.find((el) => el.requestId === item.requestId);
    const isSuccess = !!success.find((el) => el.requestId === item.requestId);
    const response =
      success.find((el) => el.requestId === item.requestId) || failed.find((el) => el.requestId === item.requestId);

    return {
      requestId: item.requestId,
      request: item.request,
      isCanceled,
      isSuccess,
      isFinished: !!response,
      response,
    };
  });

  return (
    <DevtoolsProvider
      module={module}
      setModule={setModule}
      client={client}
      success={success}
      failed={failed}
      inProgress={inProgress}
      paused={paused}
      canceled={canceled}
      requests={allRequests}
    >
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          height: "200px",
          overflowY: "auto",
          background: "#fff",
        }}
      >
        <Header />
        <Component />
      </div>
    </DevtoolsProvider>
  );
};

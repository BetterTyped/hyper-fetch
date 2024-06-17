import { useEffect, useState } from "react";
import {
  AdapterInstance,
  ClientInstance,
  ExtendRequest,
  ExtractClientAdapterType,
  QueueDataType,
  RequestEventType,
  RequestInstance,
  ResponseDetailsType,
  ResponseType,
} from "@hyper-fetch/core";

import { Header } from "./components/header/header";
import { Cache } from "./pages/cache/cache";
import { Logs } from "./pages/logs/logs";
import { Network } from "./pages/network/network";
import { Processing } from "./pages/processing/processing";
import { DevtoolsProvider } from "devtools.context";
import { DevtoolsModule } from "devtools.types";

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

  type RequestEvent = RequestEventType<
    ExtendRequest<
      RequestInstance,
      {
        adapter: ExtractClientAdapterType<T>;
      }
    >
  >;

  type RequestResponse = {
    response: ResponseType<any, any, AdapterInstance>;
    details: ResponseDetailsType;
  } & RequestEvent;

  const [success, setSuccess] = useState<RequestResponse[]>([]);
  const [failed, setFailed] = useState<RequestResponse[]>([]);
  const [inProgress, setInProgress] = useState<RequestEvent[]>([]);
  const [paused, setPaused] = useState<RequestEvent[]>([]);
  const [removed, setRemoved] = useState<RequestEvent[]>([]);

  const countProgressRequests = () => {
    const fetchRequests = client.fetchDispatcher.getAllRunningRequest();
    const submitRequests = client.submitDispatcher.getAllRunningRequest();

    const allQueuedRequest = [...fetchRequests, ...submitRequests];

    const pausedRequests = Array.from(
      client.fetchDispatcher.storage.entries() as unknown as Array<[string, QueueDataType]>,
    ).map(([, value]) => value);

    setInProgress(allQueuedRequest);
  };

  useEffect(() => {
    const unmountOnRequestStart = client.requestManager.events.onRequestStart(() => {
      countProgressRequests();
    });

    const unmountOnResponse = client.requestManager.events.onResponse(({ response, details, request, requestId }) => {
      countProgressRequests();

      if (response.success) {
        setSuccess((prev) => [...prev, { response, details, request, requestId }]);
      } else {
        setFailed((prev) => [...prev, { response, details, request, requestId }]);
      }
    });

    const unmountOnRequestPause = client.requestManager.events.onAbort((details) => {
      countProgressRequests();
    });

    const unmountOnRemove = client.requestManager.events.onRemove((details) => {
      countProgressRequests();
    });

    return () => {
      unmountOnResponse();
      unmountOnRequestStart();
      unmountOnRequestPause();
      unmountOnRemove();
    };
  }, [client]);

  return (
    <DevtoolsProvider module={module} setModule={setModule} client={client}>
      <Header />
      <Component />
    </DevtoolsProvider>
  );
};

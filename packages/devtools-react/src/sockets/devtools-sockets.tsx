import { useCallback, useState } from "react";
import { ClientInstance, QueueDataType, RequestInstance } from "@hyper-fetch/core";
import { css } from "goober";
import { Resizable, Size } from "re-resizable";

import { Header } from "components/header/header";
import { DevtoolsProvider, Sort } from "devtools.context";
import {
  DevtoolsCacheEvent,
  DevtoolsModule,
  DevtoolsElement,
  DevtoolsRequestEvent,
  DevtoolsRequestQueueStats,
  DevtoolsRequestResponse,
} from "devtools.types";
import { Status } from "utils/request.status.utils";
import { DevtoolsToggle } from "components/devtools-toggle/devtools-toggle";
import { Sidebar } from "components/sidebar/sidebar";
import { NetworkList } from "pages/network/list/network";
import { CacheList } from "pages/cache/list/cache";
import { ProcessingList } from "pages/processing/list/processing";
import { ExplorerList } from "pages/explorer/list/explorer";
import { DevtoolsDataProvider } from "pages/explorer/list/content/content.state";
import { DevtoolsWrapper } from "devtools.wrapper";
import { DevtoolsExplorerRequest } from "pages/explorer/list/content/content.types";
import { MessageType } from "./types/message.type";

const SidebarModules = {
  Network: NetworkList,
  Cache: CacheList,
  Processing: ProcessingList,
  Explorer: ExplorerList,
};

/**
 * TODO:
 * - max network elements - performance handling?
 * - max cache elements - performance handling?
 * - Do not show for production use
 * - Prop for default sizes
 */
type DevtoolsProps<T extends ClientInstance> = {
  client: T;
  initiallyOpen?: boolean;
  initialTheme?: "light" | "dark";
  initialPosition?: "Top" | "Left" | "Right" | "Bottom";
  simulatedError?: any;
  socketCallback: (callback: (response: { data: MessageType["data"]; extra: Record<string, any> }) => void) => void;
};

export const DevtoolsSocket = <T extends ClientInstance>({
  client,
  initialTheme = "dark",
  initiallyOpen = false,
  initialPosition = "Right",
  simulatedError = new Error("This is error simulated by HyperFetch Devtools"),
  socketCallback,
}: DevtoolsProps<T>) => {
  const [open, setOpen] = useState(initiallyOpen);
  const [module, setModule] = useState(DevtoolsModule.NETWORK);
  const [theme, setTheme] = useState<"light" | "dark">(initialTheme);
  // const [isOnline, setIsOnline] = useState(client.appManager.isOnline);
  const [position, setPosition] = useState<"Top" | "Left" | "Right" | "Bottom">(initialPosition);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const ListComponent = SidebarModules[module];

  // Network
  const [networkSearchTerm, setNetworkSearchTerm] = useState("");
  const [networkSort, setNetworkSort] = useState<Sort | null>(null);
  const [detailsRequestId, setDetailsRequestId] = useState<string | null>(null);
  const [networkFilter, setNetworkFilter] = useState<Status | null>(null);
  // Cache
  const [cacheSearchTerm, setCacheSearchTerm] = useState("");
  const [cacheSort, setCacheSort] = useState<Sort | null>(null);
  const [detailsCacheKey, setDetailsCacheKey] = useState<string | null>(null);
  const [loadingKeys, setLoadingKeys] = useState<string[]>([]);
  // Processing
  const [processingSearchTerm, setProcessingSearchTerm] = useState("");
  const [processingSort, setProcessingSort] = useState<Sort | null>(null);
  const [detailsQueueKey, setDetailsQueueKey] = useState<string | null>(null);

  // Explorer
  const [explorerSearchTerm, setExplorerSearchTerm] = useState("");
  const [detailsExplorerRequest, setDetailsExplorerRequest] = useState<DevtoolsExplorerRequest | null>(null);

  // Data received from sockets

  const [requests, setRequests] = useState<DevtoolsRequestEvent[]>([] as unknown as DevtoolsRequestEvent[]);
  const [success, setSuccess] = useState<DevtoolsRequestResponse[]>([]);
  const [failed, setFailed] = useState<DevtoolsRequestResponse[]>([]);
  const [removed, setRemoved] = useState<DevtoolsElement[]>([]);
  const [inProgress, setInProgress] = useState<DevtoolsElement[]>([]);
  const [paused, setPaused] = useState<DevtoolsElement[]>([]);
  const [canceled, setCanceled] = useState<DevtoolsElement[]>([]);
  const [cache, setCache] = useState<DevtoolsCacheEvent[]>([]);
  const [queues, setQueues] = useState<QueueDataType[]>([]);
  const [stats, setStats] = useState<{
    [queueKey: string]: DevtoolsRequestQueueStats;
  }>({});
  const [requestMap, setRequestMap] = useState<RequestInstance[]>([]);

  socketCallback((event) => {
    setRequests(event.data.requests);
    setSuccess(event.data.success);
    setFailed(event.data.failed);
    setRemoved(event.data.removed);
    setInProgress(event.data.inProgress);
    setPaused(event.data.paused);
    setCanceled(event.data.canceled);
    setCache(event.data.cache);
    setQueues(event.data.queues);
    setStats(event.data.stats);
    setRequestMap(event.data.requestsMap);
  });

  const handleClearNetwork = useCallback(() => {
    setRequests([]);
    setSuccess([]);
    setFailed([]);
    setInProgress([]);
    setPaused([]);
    setCanceled([]);
    setRemoved([]);
  }, []);

  const removeNetworkRequest = (requestId: string) => {
    setRequests((prev) => prev.filter((i) => i.requestId !== requestId));
    setSuccess((prev) => prev.filter((i) => i.requestId !== requestId));
    setFailed((prev) => prev.filter((i) => i.requestId !== requestId));
  };

  // TODO - add to backend
  // const handleSetOnline = useCallback(
  //   (value: boolean) => {
  //     client.appManager.setOnline(value);
  //     setIsOnline(value);
  //   },
  //   [client.appManager],
  // );

  const allRequests: DevtoolsRequestEvent[] = requests.map((item) => {
    const isCanceled = !!canceled.find((el) => el.requestId === item.requestId);
    const isSuccess = !!success.find((el) => el.requestId === item.requestId);
    const isRemoved = !!removed.find((el) => el.requestId === item.requestId);
    const isPaused = !!paused.find((el) => el.requestId === item.requestId);
    const response: any =
      success.find((el) => el.requestId === item.requestId) || failed.find((el) => el.requestId === item.requestId);

    return {
      ...response,
      requestId: item.requestId,
      request: item.request,
      details: response?.details,
      isRemoved,
      isCanceled,
      isSuccess,
      isFinished: !!response,
      isPaused,
      triggerTimestamp: item.triggerTimestamp,
    };
  });

  return (
    <DevtoolsProvider
      css={css}
      open={open}
      theme={theme}
      setTheme={setTheme}
      setOpen={setOpen}
      module={module}
      setModule={setModule}
      isOnline
      // TODO fix
      setIsOnline={() => true}
      client={client}
      success={success}
      failed={failed}
      inProgress={inProgress}
      paused={paused}
      canceled={canceled}
      requests={allRequests}
      queues={queues}
      cache={cache}
      stats={stats}
      networkSearchTerm={networkSearchTerm}
      setNetworkSearchTerm={setNetworkSearchTerm}
      networkSort={networkSort}
      setNetworkSort={setNetworkSort}
      detailsRequestId={detailsRequestId}
      setDetailsRequestId={setDetailsRequestId}
      networkFilter={networkFilter}
      setNetworkFilter={setNetworkFilter}
      clearNetwork={handleClearNetwork}
      removeNetworkRequest={removeNetworkRequest}
      cacheSearchTerm={cacheSearchTerm}
      setCacheSearchTerm={setCacheSearchTerm}
      cacheSort={cacheSort}
      setCacheSort={setCacheSort}
      detailsCacheKey={detailsCacheKey}
      setDetailsCacheKey={setDetailsCacheKey}
      processingSearchTerm={processingSearchTerm}
      setProcessingSearchTerm={setProcessingSearchTerm}
      processingSort={processingSort}
      setProcessingSort={setProcessingSort}
      detailsQueueKey={detailsQueueKey}
      setDetailsQueueKey={setDetailsQueueKey}
      loadingKeys={loadingKeys}
      setLoadingKeys={setLoadingKeys}
      position={position}
      setPosition={setPosition}
      treeState={new DevtoolsDataProvider(requestMap || [])}
      explorerSearchTerm={explorerSearchTerm}
      setExplorerSearchTerm={setExplorerSearchTerm}
      detailsExplorerRequest={detailsExplorerRequest}
      setDetailsExplorerRequest={setDetailsExplorerRequest}
      simulatedError={simulatedError}
      size={size}
      setSize={setSize}
    >
      {open && (
        <DevtoolsWrapper>
          <Header />
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              overflow: "hidden",
            }}
          >
            <Resizable
              defaultSize={{
                width: "400",
                height: "100%",
              }}
              minHeight="100%"
              maxWidth="80vw"
            >
              <Sidebar>
                <ListComponent />
              </Sidebar>
            </Resizable>
            <div style={{ position: "relative", flex: "1 1 auto", height: "100%" }}>{/* <DetailsComponent /> */}</div>
          </div>
        </DevtoolsWrapper>
      )}
      {!open && <DevtoolsToggle onClick={() => setOpen(true)} />}
    </DevtoolsProvider>
  );
};

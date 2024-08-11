import { ClientInstance, LogType, QueueDataType } from "@hyper-fetch/core";
import clsx from "clsx";
import { css } from "goober";

import {
  DevtoolsCacheEvent,
  DevtoolsModule,
  DevtoolsQueueItemData,
  DevtoolsRequestEvent,
  RequestEvent,
  RequestResponse,
} from "devtools.types";
import { createContext } from "utils/context";
import { Status } from "utils/request.status.utils";

export const cssWrapper = (...params: Parameters<typeof css>) => clsx(css(...params));

export const [DevtoolsProvider, useDevtoolsContext] = createContext("DevtoolsProvider", {
  css: cssWrapper,
  client: null as any as ClientInstance,
  open: false,
  setOpen: (() => {}) as (open: boolean) => void,
  module: DevtoolsModule.NETWORK,
  setModule: (() => {}) as (module: DevtoolsModule) => void,
  isOnline: true,
  setIsOnline: (() => {}) as (isOffline: boolean) => void,
  success: [] as RequestResponse<ClientInstance>[],
  failed: [] as RequestResponse<ClientInstance>[],
  inProgress: [] as RequestEvent<ClientInstance>[],
  paused: [] as RequestEvent<ClientInstance>[],
  canceled: [] as RequestEvent<ClientInstance>[],
  requests: [] as Array<DevtoolsRequestEvent>,
  fetchQueues: [] as QueueDataType[],
  submitQueues: [] as QueueDataType[],
  cache: [] as DevtoolsCacheEvent[],
  logs: [] as LogType[],
  // Network
  detailsRequestId: null as string | null,
  setDetailsRequestId: (() => {}) as (requestId: string | null) => void,
  networkFilter: null as string | null,
  setNetworkFilter: (() => {}) as (filter: Status | null) => void,
  // Cache
  detailsCacheKey: null as string | null,
  setDetailsCacheKey: (() => {}) as (cacheKey: string | null) => void,
  // Logs
  // ...
  // Processing
  detailsQueue: null as DevtoolsQueueItemData | null,
  setDetailsQueue: (() => {}) as (item: DevtoolsQueueItemData | null) => void,
});

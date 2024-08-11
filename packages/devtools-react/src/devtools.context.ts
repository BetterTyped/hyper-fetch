import { ClientInstance, QueueDataType } from "@hyper-fetch/core";
import clsx from "clsx";
import { css } from "goober";

import {
  DevtoolsCacheEvent,
  DevtoolsModule,
  DevtoolsRequestEvent,
  DevtoolsRequestQueueStats,
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
  queues: [] as QueueDataType[],
  cache: [] as DevtoolsCacheEvent[],
  // Network
  detailsRequestId: null as string | null,
  setDetailsRequestId: (() => {}) as (requestId: string | null) => void,
  networkFilter: null as string | null,
  setNetworkFilter: (() => {}) as (filter: Status | null) => void,
  // Cache
  detailsCacheKey: null as string | null,
  setDetailsCacheKey: (() => {}) as (cacheKey: string | null) => void,
  // Processing
  detailsQueueKey: null as string | null,
  setDetailsQueueKey: (() => {}) as (item: string | null) => void,
  stats: {} as Record<string, DevtoolsRequestQueueStats>,
});

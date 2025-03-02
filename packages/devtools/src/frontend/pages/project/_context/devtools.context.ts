import clsx from "clsx";
import React from "react";
import { css } from "goober";
import { Size } from "re-resizable";
import { ClientInstance, QueueDataType } from "@hyper-fetch/core";

import {
  DevtoolsCacheEvent,
  DevtoolsElement,
  DevtoolsRequestEvent,
  DevtoolsRequestQueueStats,
  DevtoolsRequestResponse,
} from "frontend/pages/project/_context/devtools.types";
import { createContext } from "frontend/utils/context";
import { Status } from "frontend/utils/request.status.utils";
import { DevtoolsDataProvider } from "frontend/pages/project/explorer/list/content.state";
import { DevtoolsExplorerRequest } from "frontend/pages/project/explorer/list/content.types";

export type Sort = { key: string; order: "asc" | "desc" };

export const cssWrapper = (...params: Parameters<typeof css>) => clsx(css(...params));

export const [DevtoolsProvider, useDevtoolsContext] = createContext("DevtoolsProvider", {
  css: cssWrapper,
  client: null as any as ClientInstance,
  isOnline: true,
  setIsOnline: (() => {}) as (isOffline: boolean) => void,
  success: [] as DevtoolsRequestResponse[],
  failed: [] as DevtoolsRequestResponse[],
  inProgress: [] as DevtoolsElement[],
  paused: [] as DevtoolsElement[],
  canceled: [] as DevtoolsElement[],
  requests: [] as Array<DevtoolsRequestEvent>,
  queues: [] as QueueDataType[],
  cache: [] as DevtoolsCacheEvent[],
  // Network
  detailsRequestId: null as string | null,
  setDetailsRequestId: (() => {}) as React.Dispatch<React.SetStateAction<string | null>>,
  networkFilter: null as Status | null,
  setNetworkFilter: (() => {}) as React.Dispatch<React.SetStateAction<Status | null>>,
  networkSort: null as Sort | null,
  setNetworkSort: (() => {}) as React.Dispatch<React.SetStateAction<Sort | null>>,
  networkSearchTerm: "",
  setNetworkSearchTerm: (() => {}) as React.Dispatch<React.SetStateAction<string>>,
  clearNetwork: () => {},
  removeNetworkRequest: (() => {}) as (requestId: string) => void,
  // Cache
  detailsCacheKey: null as string | null,
  setDetailsCacheKey: (() => {}) as React.Dispatch<React.SetStateAction<string | null>>,
  cacheSearchTerm: "",
  setCacheSearchTerm: (() => {}) as React.Dispatch<React.SetStateAction<string>>,
  cacheSort: null as Sort | null,
  setCacheSort: (() => {}) as React.Dispatch<React.SetStateAction<Sort | null>>,
  loadingKeys: [] as string[],
  setLoadingKeys: (() => {}) as React.Dispatch<React.SetStateAction<string[]>>,
  // Processing
  detailsQueueKey: null as string | null,
  setDetailsQueueKey: (() => {}) as React.Dispatch<React.SetStateAction<string | null>>,
  stats: {} as Record<string, DevtoolsRequestQueueStats>,
  processingSearchTerm: "",
  setProcessingSearchTerm: (() => {}) as React.Dispatch<React.SetStateAction<string>>,
  processingSort: null as Sort | null,
  setProcessingSort: (() => {}) as React.Dispatch<React.SetStateAction<Sort | null>>,
  // Explorer
  treeState: new DevtoolsDataProvider([]),
  explorerSearchTerm: "",
  setExplorerSearchTerm: (() => {}) as React.Dispatch<React.SetStateAction<string>>,
  detailsExplorerRequest: null as DevtoolsExplorerRequest | null,
  setDetailsExplorerRequest: (() => {}) as React.Dispatch<React.SetStateAction<DevtoolsExplorerRequest | null>>,
  // Common
  simulatedError: new Error("Simulated error") as any,
  size: { width: 0, height: 0 } as Size,
  setSize: (() => {}) as React.Dispatch<React.SetStateAction<Size>>,
});

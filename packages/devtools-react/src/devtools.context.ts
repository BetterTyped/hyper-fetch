import { AdapterInstance, CacheValueType, ClientInstance, LogType, QueueDataType } from "@hyper-fetch/core";

import { DevtoolsModule, DevtoolsRequestEvent, RequestEvent, RequestResponse } from "devtools.types";
import { createContext } from "utils/context";

export const [DevtoolsProvider, useDevtoolsContext] = createContext("DevtoolsProvider", {
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
  cache: [] as CacheValueType<unknown, unknown, AdapterInstance>[],
  logs: [] as LogType[],
});

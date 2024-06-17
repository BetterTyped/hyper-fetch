import { ClientInstance } from "@hyper-fetch/core";

import { DevtoolsModule, RequestEvent, RequestResponse } from "devtools.types";
import { createContext } from "utils/context";

export const [DevtoolsProvider, useDevtoolsContext] = createContext("DevtoolsProvider", {
  client: null as ClientInstance,

  module: DevtoolsModule.NETWORK,
  setModule: (() => {}) as (module: DevtoolsModule) => void,

  success: [] as RequestResponse<ClientInstance>[],
  failed: [] as RequestResponse<ClientInstance>[],
  inProgress: [] as RequestEvent<ClientInstance>[],
  paused: [] as RequestEvent<ClientInstance>[],
  canceled: [] as RequestEvent<ClientInstance>[],
});

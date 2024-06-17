import { ClientInstance } from "@hyper-fetch/core";

import { DevtoolsModule } from "devtools.types";
import { createContext } from "utils/context";

export const [DevtoolsProvider, useDevtoolsContext] = createContext("DevtoolsProvider", {
  client: null as ClientInstance,
  module: DevtoolsModule.NETWORK,
  setModule: (() => {}) as (module: DevtoolsModule) => void,
});

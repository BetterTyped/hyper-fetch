import { createContext } from "utils/context";
import { Status } from "utils/request.status.utils";

export const [NetworkProvider, useNetworkContext] = createContext("NetworkProvider", {
  requestId: null as string | null,
  setRequestId: (() => {}) as (requestId: string | null) => void,
  filter: null as Status | null,
  setFilter: (() => {}) as (filter: Status | null) => void,
});

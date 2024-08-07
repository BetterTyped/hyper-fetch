import { createContext } from "utils/context";

export const [NetworkProvider, useNetworkContext] = createContext("NetworkProvider", {
  requestId: null as string | null,
  setRequestId: (() => {}) as (requestId: string | null) => void,
});

import { getOrpcAdapter } from "./adapter.fetch";
import type { OrpcAdapterOptionsType, OrpcAdapterType } from "./adapter.types";

/**
 * Adapter calling oRPC procedures with the RPC protocol.
 * The endpoint is the procedure path and the payload is the procedure input.
 *
 * @example
 * const client = createClient({ url: "http://localhost:3000/rpc" }).setAdapter(OrpcAdapter());
 */
export const OrpcAdapter = (options?: OrpcAdapterOptionsType): OrpcAdapterType => {
  return getOrpcAdapter(options);
};

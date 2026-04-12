import type { AdapterInstance, ResponseType } from "adapter";
import type { RequestCacheType } from "cache";
import type { RequestInstance } from "request";

export type HydrationOptions = RequestCacheType<RequestInstance> & {
  override: boolean;
};

export type HydrateDataType<Data = any, Error = any, Adapter extends AdapterInstance = any> = HydrationOptions & {
  /** Hydration timestamp */
  timestamp: number;
  /** Hydrated response */
  response: ResponseType<Data, Error, Adapter>;
  /** Hydrated flag */
  hydrated: true;
};

import { getTrpcAdapter } from "./adapter.fetch";
import type { TrpcAdapterOptionsType, TrpcAdapterType } from "./adapter.types";

export const TrpcAdapter = (options?: TrpcAdapterOptionsType): TrpcAdapterType => {
  return getTrpcAdapter(options);
};

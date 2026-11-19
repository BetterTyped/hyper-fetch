import { Time } from "@hyper-fetch/core";

import type { TrpcExtraType } from "./adapter.types";

export const defaultTimeout = Time.SEC * 5;

export const trpcExtra: TrpcExtraType = {
  headers: {},
};

export const TrpcMethods = {
  QUERY: "QUERY",
  MUTATION: "MUTATION",
} as const;

/** Query string keys owned by the tRPC HTTP format - they win over the user query params */
export const reservedQueryParams = ["input", "batch"];

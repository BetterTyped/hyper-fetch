import { Time } from "@hyper-fetch/core";

import type { OrpcExtraType } from "./adapter.types";

export const defaultTimeout = Time.SEC * 5;

export const orpcExtra: OrpcExtraType = {
  headers: {},
};

export const OrpcMethods = {
  QUERY: "QUERY",
  MUTATION: "MUTATION",
} as const;

/** Query string key owned by the oRPC RPC protocol - it wins over the user query params */
export const reservedQueryParams = ["data"];

/** Longer GET urls are sent with POST, the same limit as the `RPCLink` of oRPC */
export const maxGetUrlLength = 2083;

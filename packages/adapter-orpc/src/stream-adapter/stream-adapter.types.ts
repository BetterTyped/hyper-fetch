import type { QueryParamsType, stringifyQueryParams } from "@hyper-fetch/core";
import type { SocketAdapter } from "@hyper-fetch/sockets";

import type { OrpcSocketExtraType } from "../socket/socket.types";

/** Options of the `OrpcStreamAdapter`, set with the `adapterOptions` of the socket or per connection in `onConnect` */
export type OrpcStreamAdapterOptionsType = {
  /**
   * Connects when the socket is created. Without it, call `socket.connect()`.
   * @default true
   */
  autoConnect?: boolean;
  /** Headers of every stream request, e.g. the `authorization` header */
  headers?: Record<string, string>;
  /**
   * The `fetch` used for the streams, e.g. one with a proxy agent or a mock in tests. Defaults to the global `fetch`
   * of browsers, Node.js 18+, Bun and Deno.
   */
  fetch?: typeof fetch;
  /** Options passed to `fetch`, e.g. `credentials: "include"` for cookies on another origin */
  fetchOptions?: Omit<RequestInit, "method" | "headers" | "body" | "signal">;
};

export type OrpcStreamAdapterType = SocketAdapter<
  OrpcSocketExtraType,
  OrpcStreamAdapterOptionsType,
  undefined,
  undefined,
  QueryParamsType | string,
  typeof stringifyQueryParams
>;

import type { QueryParamsType, stringifyQueryParams } from "@hyper-fetch/core";
import type { SocketAdapter } from "@hyper-fetch/sockets";

import type { OrpcSocketExtraType } from "../socket/socket.types";

/** Options of the `OrpcWebsocketAdapter`, set with the `adapterOptions` of the socket or per connection in `onConnect` */
export type OrpcWebsocketAdapterOptionsType = {
  /**
   * Connects when the socket is created. Without it, call `socket.connect()`.
   * @default true
   */
  autoConnect?: boolean;
  /**
   * The WebSocket constructor, e.g. from the `ws` package. Defaults to the global `WebSocket` of browsers,
   * Node.js 22+, Bun and Deno. Pass it in runtimes without the global.
   */
  WebSocket?: typeof WebSocket;
  /** Subprotocols passed to the `WebSocket` constructor (`Sec-WebSocket-Protocol` header) */
  protocols?: string | string[];
  /** Headers of every subscription request, the procedures read them the same as the headers of HTTP requests */
  headers?: Record<string, string>;
};

export type OrpcWebsocketAdapterType = SocketAdapter<
  OrpcSocketExtraType,
  OrpcWebsocketAdapterOptionsType,
  undefined,
  undefined,
  QueryParamsType | string,
  typeof stringifyQueryParams
>;

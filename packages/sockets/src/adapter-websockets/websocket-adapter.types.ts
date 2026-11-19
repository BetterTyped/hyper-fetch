/** Listener event decoded from an incoming frame */
export type WebsocketDecodedMessageType = { topic: string; data: unknown };

/** Emitted message to be encoded into an outgoing frame */
export type WebsocketEncodeMessageType = { topic: string; payload: unknown };

/** Frame accepted by `WebSocket.send` */
export type WebsocketFrameType = Parameters<WebSocket["send"]>[0];

/**
 * A `WebSocket` class, e.g. the `WebSocket` export of the `ws` package on Node.js versions without a global one.
 * It only needs the standard browser API: `addEventListener`, `send`, `close` and `readyState`.
 */
export type WebsocketImplementationType = new (url: string, protocols?: string | string[]) => unknown;

/** `WebSocket.readyState` values, so no global `WebSocket` is needed to read them */
export const WebsocketReadyState = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const;

export type WebsocketAdapterOptionsType = {
  /**
   * The `WebSocket` class used to open connections. Defaults to `window.WebSocket`.
   * Without a `window` (Node.js, Deno, Bun, server-side rendering) nothing connects unless you pass one, e.g. the
   * global `WebSocket` of Node.js 22+ or `import { WebSocket } from "ws"`. This keeps server renders from connecting.
   */
  webSocketImpl?: WebsocketImplementationType;
  /**
   * Subprotocols passed to the `WebSocket` constructor (`Sec-WebSocket-Protocol` header).
   * To resolve them per connection attempt (e.g. short-lived auth tokens) use `socket.onConnect`.
   */
  protocols?: string | string[];
  pingTimeout?: number;
  pongTimeout?: number;
  heartbeatMessage?: string;
  heartbeat?: boolean;
  autoConnect?: boolean;
  /**
   * Turns an incoming frame into a listener event - use it when the server does not send `{ topic, data }`
   * (e.g. `{ type, payload }`). Return `null` to ignore the frame (pings, unknown messages).
   * Defaults to parsing the frame as JSON and reading its `topic` and `data` fields.
   */
  decode?: (event: MessageEvent) => WebsocketDecodedMessageType | null;
  /**
   * Turns an emitted message (and the heartbeat ping) into the frame passed to `websocket.send`.
   * Defaults to `JSON.stringify({ topic, data: payload })`.
   */
  encode?: (message: WebsocketEncodeMessageType) => WebsocketFrameType;
};

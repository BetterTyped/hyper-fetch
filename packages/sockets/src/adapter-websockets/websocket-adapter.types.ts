export type WebsocketAdapterOptionsType = {
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
};

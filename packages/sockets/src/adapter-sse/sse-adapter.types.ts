// Options

/** Listener event decoded from an incoming message */
export type SSEDecodedMessageType = { topic: string; data: unknown };

/**
 * An `EventSource` class, e.g. the `EventSource` export of the `eventsource` package where there is no global one.
 * It only needs the standard browser API.
 */
export type EventSourceImplementationType = new (url: string, eventSourceInit?: EventSourceInit) => unknown;

/** `EventSource.readyState` values, so no global `EventSource` is needed to read them */
export const EventSourceReadyState = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSED: 2,
} as const;

export type SSEAdapterOptionsType = {
  /**
   * The `EventSource` class used to open connections. Defaults to `window.EventSource`.
   * Without a `window` (Node.js, Deno, Bun, server-side rendering) nothing connects unless you pass one, e.g.
   * `import { EventSource } from "eventsource"`. This keeps server renders from connecting.
   */
  eventSourceImpl?: EventSourceImplementationType;
  eventSourceInit?: EventSourceInit;
  autoConnect?: boolean;
  /**
   * Turns an incoming message into a listener event - use it when the server does not send `{ topic, data }`
   * (e.g. `{ type, payload }`). Return `null` to ignore the message.
   * Defaults to parsing the message as JSON and reading its `topic` and `data` fields.
   */
  decode?: (event: MessageEvent) => SSEDecodedMessageType | null;
};

// Options

/** Listener event decoded from an incoming message */
export type SSEDecodedMessageType = { topic: string; data: unknown };

export type SSEAdapterOptionsType = {
  /**
   * The EventSource constructor, e.g. from the `eventsource` package. Defaults to the global `EventSource` of
   * browsers, Deno and Bun. Node.js has no global one - pass it there.
   */
  EventSource?: typeof EventSource;
  eventSourceInit?: EventSourceInit;
  autoConnect?: boolean;
  /**
   * Turns an incoming message into a listener event - use it when the server does not send `{ topic, data }`
   * (e.g. `{ type, payload }`). Return `null` to ignore the message.
   * Defaults to parsing the message as JSON and reading its `topic` and `data` fields.
   */
  decode?: (event: MessageEvent) => SSEDecodedMessageType | null;
};

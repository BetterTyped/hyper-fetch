// Options

/** Listener event decoded from an incoming message */
export type SSEDecodedMessageType = { topic: string; data: unknown };

export type SSEAdapterOptionsType = {
  eventSourceInit?: EventSourceInit;
  autoConnect?: boolean;
  /**
   * Turns an incoming message into a listener event - use it when the server does not send `{ topic, data }`
   * (e.g. `{ type, payload }`). Return `null` to ignore the message.
   * Defaults to parsing the message as JSON and reading its `topic` and `data` fields.
   */
  decode?: (event: MessageEvent) => SSEDecodedMessageType | null;
};

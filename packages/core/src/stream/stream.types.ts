/** A single Server-Sent Event, as dispatched by the SSE parser. */
export type ServerSentEventType = {
  /** Event type from the `event:` field, `"message"` when not set */
  event: string;
  /** Joined `data:` lines (separated with `\n`) */
  data: string;
  /** Last event ID seen on the stream (`id:` field), persists across events like in EventSource */
  id: string;
  /** Reconnection time from the `retry:` field, when sent with this event */
  retry?: number;
};

export type StreamParserType = {
  /** Feed the next piece of the decoded stream. Pieces may split lines or events at any position. */
  feed: (text: string) => void;
  /** Signal the end of the stream and process whatever is still buffered. */
  flush: () => void;
  /** Drop all buffered state, e.g. before a retried request starts streaming again. */
  reset: () => void;
};

export type SSEParserOptionsType = {
  /** Called for every complete event */
  onEvent: (event: ServerSentEventType) => void;
  /** Called for every comment line (starting with `:`), e.g. keep-alive pings */
  onComment?: (comment: string) => void;
};

export type NDJSONParserOptionsType<T = unknown> = {
  /** Called for every parsed line */
  onValue: (value: T) => void;
  /**
   * Called when a line is not valid JSON. When not provided, the error is thrown from `feed`/`flush`.
   */
  onError?: (error: Error, line: string) => void;
};

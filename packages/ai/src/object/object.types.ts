import type { StreamParserType } from "@hyper-fetch/core";

export type ObjectStreamEventType =
  /** A piece of the JSON text */
  | { type: "text-delta"; delta: string }
  /** The complete object, when the backend sends it explicitly (TanStack AI structured output) */
  | { type: "object"; object: unknown }
  | { type: "error"; errorText: string };

/** Connects `useObject` / `ObjectStream` to a backend wire format. */
export type ObjectProtocolType = {
  name: string;
  prepareRequest: (
    input: unknown,
    context: { runId: string },
  ) => { payload: unknown; headers?: Record<string, string> };
  createDecoder: (emit: (event: ObjectStreamEventType) => void) => StreamParserType;
};

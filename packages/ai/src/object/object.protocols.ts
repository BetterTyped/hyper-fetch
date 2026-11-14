import type { StreamParserType } from "@hyper-fetch/core";

import { createAGUIDecoder } from "../protocols/ag-ui/ag-ui.protocol";
import { generateId } from "../utils/id";
import type { ObjectProtocolType } from "./object.types";

/**
 * Plain text stream of JSON - what AI SDK's `useObject` consumes (`streamText({ output: Output.object(...) })` +
 * `createTextStreamResponse`, or the older `streamObject().toTextStreamResponse()`). The input is POSTed as-is.
 */
export const textObjectProtocol = (
  options: { prepareBody?: (input: unknown) => unknown } = {},
): ObjectProtocolType => ({
  name: "text",
  prepareRequest: (input) => ({ payload: options.prepareBody ? options.prepareBody(input) : input }),
  createDecoder: (emit): StreamParserType => ({
    feed: (text) => {
      if (text) {
        emit({ type: "text-delta", delta: text });
      }
    },
    flush: () => {},
    reset: () => {},
  }),
});

/**
 * Structured output over AG-UI events, as sent by TanStack AI (`structured-output.start`, JSON text in
 * `TEXT_MESSAGE_CONTENT`, then `structured-output.complete` with the final object).
 */
export const aguiObjectProtocol = (
  options: {
    prepareBody?: (input: unknown, context: { runId: string }) => unknown;
    headers?: Record<string, string>;
  } = {},
): ObjectProtocolType => ({
  name: "ag-ui",
  prepareRequest: (input, { runId }) => ({
    payload: options.prepareBody
      ? options.prepareBody(input, { runId })
      : {
          threadId: generateId("thread_"),
          runId,
          state: {},
          messages: [
            {
              id: generateId("msg_"),
              role: "user",
              content: typeof input === "string" ? input : JSON.stringify(input),
            },
          ],
          tools: [],
          context: [],
          forwardedProps: {},
        },
    headers: { "X-Run-Id": runId, ...options.headers },
  }),
  createDecoder: (emit) =>
    createAGUIDecoder((event) => {
      if (event.type === "text-delta") {
        emit({ type: "text-delta", delta: event.delta });
      } else if (event.type === "data" && event.name === "structured-output.complete") {
        const value = event.data as { object?: unknown } | undefined;
        if (value && "object" in value) {
          emit({ type: "object", object: value.object });
        }
      } else if (event.type === "error") {
        emit({ type: "error", errorText: event.errorText });
      }
    }),
});

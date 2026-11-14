/**
 * Helpers that encode events the way the backends send them, so tests can mock AI responses with HyperFetch's mocker
 * (`request.setMock(() => ({ chunks, status: 200 }))`) or any HTTP mock.
 */

export type AISDKStreamChunkType = { type: string; [key: string]: unknown };
export type AGUIStreamEventType = { type: string; [key: string]: unknown };

/** Encode AI SDK UI message stream chunks as SSE, terminated with `data: [DONE]` like the AI SDK server. */
export const encodeAISDKStream = (chunks: AISDKStreamChunkType[], options: { done?: boolean } = {}): string[] => [
  ...chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`),
  ...(options.done === false ? [] : ["data: [DONE]\n\n"]),
];

/** Encode AG-UI events as SSE (default) or NDJSON. */
export const encodeAGUIStream = (
  events: AGUIStreamEventType[],
  options: { framing?: "sse" | "ndjson" } = {},
): string[] =>
  events.map((event) =>
    options.framing === "ndjson" ? `${JSON.stringify(event)}\n` : `data: ${JSON.stringify(event)}\n\n`,
  );

/**
 * Split encoded text into pieces of `size` characters - real networks don't respect event boundaries, so tests should
 * not either.
 */
export const splitIntoChunks = (pieces: string[], size: number): string[] => {
  const text = pieces.join("");
  const result: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    result.push(text.slice(i, i + size));
  }
  return result;
};

/** A typical AI SDK text answer: start, one step with one text part, finish. */
export const aiSDKTextAnswer = (
  text: string,
  options: { messageId?: string; words?: boolean } = {},
): AISDKStreamChunkType[] => {
  const deltas = options.words === false ? [text] : text.split(/(?<= )/);
  return [
    { type: "start", ...(options.messageId && { messageId: options.messageId }) },
    { type: "start-step" },
    { type: "text-start", id: "t1" },
    ...deltas.map((delta) => ({ type: "text-delta", id: "t1", delta })),
    { type: "text-end", id: "t1" },
    { type: "finish-step" },
    { type: "finish", finishReason: "stop" },
  ];
};

/** A typical AG-UI text answer: run started, one text message, run finished. */
export const aguiTextAnswer = (
  text: string,
  options: { threadId?: string; runId?: string; messageId?: string } = {},
): AGUIStreamEventType[] => {
  const threadId = options.threadId ?? "thread-1";
  const runId = options.runId ?? "run-1";
  const messageId = options.messageId ?? "msg-1";
  return [
    { type: "RUN_STARTED", threadId, runId },
    { type: "TEXT_MESSAGE_START", messageId, role: "assistant" },
    ...text.split(/(?<= )/).map((delta) => ({ type: "TEXT_MESSAGE_CONTENT", messageId, delta })),
    { type: "TEXT_MESSAGE_END", messageId },
    { type: "RUN_FINISHED", threadId, runId, outcome: { type: "success" } },
  ];
};

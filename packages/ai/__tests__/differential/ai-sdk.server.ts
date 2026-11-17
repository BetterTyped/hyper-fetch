/**
 * A real Vercel AI SDK (v7) backend without the HTTP hop: `streamText` with a scripted mock model, real tools and the
 * real UI message stream encoder. `respond(messages)` returns the exact bytes an AI SDK route handler would send.
 */
import type { InferUITools, ModelMessage, UIMessage } from "ai";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  dynamicTool,
  stepCountIs,
  streamText,
  tool,
  toUIMessageStream,
  validateUIMessages,
} from "ai";
import { MockLanguageModelV4, simulateReadableStream } from "ai/test";
import { z } from "zod";

const serverTools = {
  getWeather: tool({
    description: "Get the weather in a city",
    inputSchema: z.object({ city: z.string() }),
    execute: async ({ city }) => ({ city, temperature: 21 }),
  }),
  failing: tool({
    description: "Always fails",
    inputSchema: z.object({ reason: z.string() }),
    execute: async ({ reason }): Promise<string> => {
      throw new Error(`Tool failed: ${reason}`);
    },
  }),
  research: tool({
    description: "Streams progress before the final result",
    inputSchema: z.object({ topic: z.string() }),
    async *execute({ topic }) {
      yield { status: "searching" as const, topic };
      yield { status: "reading" as const, topic };
      yield { status: "done" as const, topic, summary: `All about ${topic}` };
    },
  }),
  researchThenFail: tool({
    description: "Streams progress and then fails",
    inputSchema: z.object({ topic: z.string() }),
    async *execute({ topic }): AsyncGenerator<{ status: string; topic: string }> {
      yield { status: "searching", topic };
      throw new Error("Research interrupted");
    },
  }),
  deleteFile: tool({
    description: "Delete a file - needs approval",
    inputSchema: z.object({ path: z.string() }),
    needsApproval: true,
    execute: async ({ path }) => ({ deleted: path }),
  }),
  // Client-side tool: no execute on the server
  askConfirmation: tool({
    description: "Ask the user to confirm",
    inputSchema: z.object({ question: z.string() }),
    outputSchema: z.object({ confirmed: z.boolean() }),
  }),
  lookup: dynamicTool({
    description: "A tool that is only known at runtime",
    inputSchema: z.object({ key: z.string() }),
    execute: async (input) => ({ found: (input as { key: string }).key }),
  }),
};

type ServerUIMessage = UIMessage<
  { model: string; steps?: number },
  { status: { phase: string } },
  InferUITools<typeof serverTools>
>;

/** The prompt the model gets for a request body, as the backend builds it. */
export const toServerModelMessages = (messages: UIMessage[]): Promise<ModelMessage[]> =>
  convertToModelMessages(messages, { tools: serverTools });

// LanguageModelV4StreamPart, read from the mock model so @ai-sdk/provider doesn't have to be a dependency
export type ModelStreamPart =
  ReturnType<MockLanguageModelV4["doStream"]> extends PromiseLike<{ stream: ReadableStream<infer Part> }>
    ? Part
    : never;

const usage = {
  inputTokens: { total: 3, noCache: 3, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 5, text: 5, reasoning: undefined },
};

/** Model output for one step. Text ids are per-step indexes ("0", "1"...), the way Anthropic and OpenAI number them. */
export type ModelStepType = {
  reasoning?: string;
  text?: string;
  toolCalls?: { id: string; name: string; input: unknown; raw?: string }[];
  sources?: { id: string; url: string; title?: string }[];
  files?: { mediaType: string; base64: string }[];
  after?: string;
};

const split = (value: string) => value.match(/[\s\S]{1,6}/g) ?? [];

const toStreamParts = (step: ModelStepType): ModelStreamPart[] => {
  const parts: ModelStreamPart[] = [{ type: "stream-start", warnings: [] }];
  let index = 0;
  const nextId = () => {
    index += 1;
    return String(index - 1);
  };
  if (step.reasoning !== undefined) {
    const id = nextId();
    parts.push(
      { type: "reasoning-start", id },
      ...split(step.reasoning).map((delta) => ({ type: "reasoning-delta" as const, id, delta })),
      { type: "reasoning-end", id },
    );
  }
  if (step.text !== undefined) {
    const id = nextId();
    parts.push(
      { type: "text-start", id },
      ...split(step.text).map((delta) => ({ type: "text-delta" as const, id, delta })),
      { type: "text-end", id },
    );
  }
  step.sources?.forEach((source) => {
    parts.push({ type: "source", sourceType: "url", ...source });
  });
  step.files?.forEach((file) => {
    parts.push({ type: "file", mediaType: file.mediaType, data: { type: "data", data: file.base64 } });
  });
  step.toolCalls?.forEach((call) => {
    const input = call.raw ?? JSON.stringify(call.input);
    parts.push(
      { type: "tool-input-start", id: call.id, toolName: call.name },
      ...split(input).map((delta) => ({ type: "tool-input-delta" as const, id: call.id, delta })),
      { type: "tool-input-end", id: call.id },
      { type: "tool-call", toolCallId: call.id, toolName: call.name, input },
    );
  });
  if (step.after !== undefined) {
    const id = nextId();
    parts.push(
      { type: "text-start", id },
      ...split(step.after).map((delta) => ({ type: "text-delta" as const, id, delta })),
      { type: "text-end", id },
    );
  }
  parts.push({
    type: "finish",
    finishReason: step.toolCalls?.length
      ? { unified: "tool-calls", raw: "tool_calls" }
      : { unified: "stop", raw: "stop" },
    usage,
  });
  return parts;
};

export type ServerScriptType = ModelStepType[];

/**
 * Create a backend that answers every model call with the next scripted step. One script covers a whole
 * conversation, also across several requests (client tools, approvals).
 */
export const createAISDKServer = (
  script: ServerScriptType,
): { respond: (uiMessages: unknown) => Promise<string>; requests: UIMessage[][]; modelCalls: () => number } => {
  let call = 0;
  const requests: UIMessage[][] = [];

  const model = new MockLanguageModelV4({
    doStream: async () => {
      const step = script[Math.min(call, script.length - 1)];
      call += 1;
      return { stream: simulateReadableStream({ chunks: toStreamParts(step) }) };
    },
  });

  const respond = async (uiMessages: unknown): Promise<string> => {
    // What a careful AI SDK route handler does with the request body
    const messages = (await validateUIMessages({ messages: uiMessages, tools: serverTools })) as ServerUIMessage[];
    requests.push(messages);
    const result = streamText({
      model,
      messages: await convertToModelMessages(messages, { tools: serverTools }),
      tools: serverTools,
      stopWhen: stepCountIs(6),
    });
    const stream = createUIMessageStream<ServerUIMessage>({
      originalMessages: messages,
      execute: ({ writer }) => {
        writer.write({ type: "data-status", id: "status", data: { phase: "started" } });
        writer.merge(
          toUIMessageStream<typeof serverTools, ServerUIMessage>({
            stream: result.stream,
            tools: serverTools,
            sendSources: true,
            messageMetadata: ({ part }) => {
              if (part.type === "start") {
                return { model: "mock-model" };
              }
              return part.type === "finish" ? { model: "mock-model", steps: call } : undefined;
            },
          }),
        );
      },
    });
    return createUIMessageStreamResponse({ stream }).text();
  };

  return { respond, requests, modelCalls: () => call };
};

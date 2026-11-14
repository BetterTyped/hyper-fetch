/**
 * @vitest-environment node
 *
 * End-to-end against the real Vercel AI SDK (v7): an AI SDK server with a mock language model streams over real HTTP,
 * and the HyperFetch chat consumes it. Proves wire compatibility and end-to-end types.
 */
import type { ChatToolPartType, InferAISDKChatTypes } from "@hyper-fetch/ai";
import {
  aiSDKProtocol,
  aiSDKTextProtocol,
  Chat,
  ChatStreamError,
  lastAssistantMessageIsCompleteWithToolCalls,
  ObjectStream,
  textObjectProtocol,
} from "@hyper-fetch/ai";
import { Client } from "@hyper-fetch/core";
import { createE2EServer } from "@hyper-fetch/testing";
import type { InferUITools, UIMessage } from "ai";
import {
  convertToModelMessages,
  createTextStreamResponse,
  createUIMessageStream,
  createUIMessageStreamResponse,
  Output,
  stepCountIs,
  streamText,
  tool,
  toTextStream,
  toUIMessageStream,
} from "ai";
import { MockLanguageModelV4, simulateReadableStream } from "ai/test";
import type http from "http";
import { z } from "zod";

/* -------------------------------------------------------------------------------------------------
 * "Server" - what a user would write with AI SDK
 * -----------------------------------------------------------------------------------------------*/

const tools = {
  getWeather: tool({
    description: "Get the weather in a city",
    inputSchema: z.object({ city: z.string() }),
    execute: async ({ city }) => ({ city, temperature: 21 }),
  }),
  // Client-side tool: no execute on the server
  askConfirmation: tool({
    description: "Ask the user to confirm",
    inputSchema: z.object({ question: z.string() }),
    outputSchema: z.object({ confirmed: z.boolean() }),
  }),
};

type ServerUIMessage = UIMessage<
  { model: string },
  { weather: { city: string; status: "loading" | "done" } },
  InferUITools<typeof tools>
>;

// LanguageModelV4StreamPart, read from the mock model so @ai-sdk/provider doesn't have to be a dependency
type StreamPart =
  ReturnType<MockLanguageModelV4["doStream"]> extends PromiseLike<{ stream: ReadableStream<infer Part> }>
    ? Part
    : never;

const usage = {
  inputTokens: { total: 3, noCache: 3, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 5, text: 5, reasoning: undefined },
};

const textParts = (text: string): StreamPart[] => [
  { type: "stream-start", warnings: [] },
  { type: "text-start", id: "t1" },
  ...text.split(/(?<= )/).map((delta) => ({ type: "text-delta" as const, id: "t1", delta })),
  { type: "text-end", id: "t1" },
  { type: "finish", finishReason: { unified: "stop", raw: "stop" }, usage },
];

const toolCallParts = (toolName: string, input: unknown): StreamPart[] => [
  { type: "stream-start", warnings: [] },
  { type: "tool-call", toolCallId: `call-${toolName}`, toolName, input: JSON.stringify(input) },
  { type: "finish", finishReason: { unified: "tool-calls", raw: "tool_calls" }, usage },
];

/** Mock model that answers based on the conversation, like a (very simple) real model would. */
const createModel = () =>
  new MockLanguageModelV4({
    doStream: async ({ prompt }) => {
      const last = prompt[prompt.length - 1];
      const userText = JSON.stringify(prompt.filter((message) => message.role === "user").at(-1)?.content ?? "");

      let parts: StreamPart[];
      if (last.role === "tool") {
        const output = JSON.stringify(last.content);
        parts = textParts(output.includes("21") ? "It is 21 degrees in Oslo" : "Thanks for confirming");
      } else if (userText.includes("weather")) {
        parts = toolCallParts("getWeather", { city: "Oslo" });
      } else if (userText.includes("confirm")) {
        parts = toolCallParts("askConfirmation", { question: "Are you sure?" });
      } else if (userText.includes("explode")) {
        throw new Error("Model exploded");
      } else if (userText.includes("object")) {
        parts = textParts('{"title": "Plan", "steps": ["wake up", "write tests"]}');
      } else {
        parts = textParts("Hello from the AI SDK server");
      }
      return { stream: simulateReadableStream({ chunks: parts, chunkDelayInMs: 1 }) };
    },
  });

const { route, startServer, stopServer } = createE2EServer();
let baseUrl: string;

const sendResponse = async (response: Response, res: http.ServerResponse) => {
  res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
  const reader = (response.body as ReadableStream<Uint8Array>).getReader();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    res.write(value);
  }
  res.end();
};

beforeAll(async () => {
  route("POST", "/api/chat", async (_req, res, body) => {
    const { messages } = JSON.parse(body.toString()) as { messages: ServerUIMessage[] };
    const result = streamText({
      model: createModel(),
      messages: await convertToModelMessages(messages, { tools }),
      tools,
      stopWhen: stepCountIs(5),
    });
    const stream = createUIMessageStream<ServerUIMessage>({
      originalMessages: messages,
      execute: ({ writer }) => {
        writer.write({ type: "data-weather", id: "w1", data: { city: "Oslo", status: "loading" } });
        writer.merge(
          toUIMessageStream<typeof tools, ServerUIMessage>({
            stream: result.stream,
            tools,
            messageMetadata: ({ part }) => (part.type === "start" ? { model: "mock-model" } : undefined),
          }),
        );
      },
    });
    await sendResponse(createUIMessageStreamResponse({ stream }), res);
  });

  route("POST", "/api/text", async (_req, res) => {
    const result = streamText({ model: createModel(), prompt: "hi" });
    await sendResponse(createTextStreamResponse({ stream: toTextStream({ stream: result.stream }) }), res);
  });

  route("POST", "/api/object", async (_req, res, body) => {
    const { topic } = JSON.parse(body.toString()) as { topic: string };
    const result = streamText({
      model: createModel(),
      prompt: `object about ${topic}`,
      output: Output.object({ schema: z.object({ title: z.string(), steps: z.array(z.string()) }) }),
    });
    await sendResponse(createTextStreamResponse({ stream: toTextStream({ stream: result.stream }) }), res);
  });

  baseUrl = await startServer();
});

afterAll(async () => {
  await stopServer();
});

/* -------------------------------------------------------------------------------------------------
 * "Client" - HyperFetch
 * -----------------------------------------------------------------------------------------------*/

type ChatTypes = InferAISDKChatTypes<ServerUIMessage>;

const createChat = (options: Partial<ConstructorParameters<typeof Chat<ChatTypes>>[0]> = {}) => {
  const client = new Client({ url: baseUrl });
  const request = client.createRequest<{ response: string; payload: unknown }>()({
    endpoint: "/api/chat",
    method: "POST",
  });
  return new Chat<ChatTypes>({ request, protocol: aiSDKProtocol(), ...options });
};

describe("E2E [ AI SDK v7 server ]", () => {
  it("should stream a text answer with metadata and data parts", async () => {
    const onData = vi.fn();
    const chat = createChat({ onData });

    await chat.sendMessage("Hi there");

    expect(chat.status).toBe("ready");
    const [, assistant] = chat.messages;
    expect(assistant.metadata).toEqual({ model: "mock-model" });
    expect(assistant.parts).toContainEqual({
      type: "data",
      name: "weather",
      id: "w1",
      data: { city: "Oslo", status: "loading" },
    });
    const text = assistant.parts.find((part) => part.type === "text");
    expect(text).toMatchObject({ text: "Hello from the AI SDK server", state: "done" });
    expect(onData).toHaveBeenCalledWith({ name: "weather", id: "w1", data: { city: "Oslo", status: "loading" } });
  });

  it("should show server tool calls with typed input and output", async () => {
    const chat = createChat();

    await chat.sendMessage("What is the weather?");

    const [, assistant] = chat.messages;
    const weather = assistant.parts.find(
      (part): part is Extract<ChatToolPartType<ChatTypes>, { toolName: "getWeather" }> =>
        part.type === "tool" && part.toolName === "getWeather",
    );
    expect(weather).toMatchObject({
      state: "output-available",
      input: { city: "Oslo" },
      output: { city: "Oslo", temperature: 21 },
    });
    if (weather?.state === "output-available") {
      expectTypeOf(weather.input).toEqualTypeOf<{ city: string }>();
      expectTypeOf(weather.output).toEqualTypeOf<{ city: string; temperature: number }>();
    }
    expect(assistant.parts.filter((part) => part.type === "step-start")).toHaveLength(2);
    expect(assistant.parts.find((part) => part.type === "text")).toMatchObject({ text: "It is 21 degrees in Oslo" });
  });

  it("should run client tools and continue the conversation on the server", async () => {
    const execute = vi.fn(async ({ question }: { question: string }) => ({ confirmed: question.length > 0 }));
    const chat = createChat({
      tools: { askConfirmation: { execute } },
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    });

    await chat.sendMessage("Please confirm the order");
    await vi.waitFor(() => expect(chat.messages[1].parts.some((part) => part.type === "text")).toBe(true));
    await vi.waitFor(() => expect(chat.status).toBe("ready"));

    expect(execute).toHaveBeenCalledWith({ question: "Are you sure?" }, { toolCallId: "call-askConfirmation" });
    expect(chat.messages).toHaveLength(2);
    expect(chat.messages[1].parts.find((part) => part.type === "tool")).toMatchObject({
      toolName: "askConfirmation",
      state: "output-available",
      output: { confirmed: true },
    });
    expect(chat.messages[1].parts.find((part) => part.type === "text")).toMatchObject({
      text: "Thanks for confirming",
    });
  });

  it("should regenerate an answer through the server", async () => {
    const chat = createChat();
    await chat.sendMessage("Hi");
    const firstId = chat.messages[1].id;

    await chat.regenerate();

    expect(chat.messages).toHaveLength(2);
    expect(chat.messages[1].id).not.toBe(firstId);
    expect(chat.messages[1].parts.find((part) => part.type === "text")).toMatchObject({
      text: "Hello from the AI SDK server",
    });
  });

  it("should surface server errors as stream errors", async () => {
    const chat = createChat();

    await chat.sendMessage("explode please");

    expect(chat.status).toBe("error");
    expect(chat.error).toBeInstanceOf(ChatStreamError);
  });

  it("should consume the plain text stream protocol", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: string; payload: unknown }>()({
      endpoint: "/api/text",
      method: "POST",
    });
    const chat = new Chat({ request, protocol: aiSDKTextProtocol() });

    await chat.sendMessage("hi");

    expect(chat.messages[1].parts.find((part) => part.type === "text")).toMatchObject({
      text: "Hello from the AI SDK server",
    });
  });

  it("should stream a typed object like AI SDK's useObject", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: string; payload: { topic: string } }>()({
      endpoint: "/api/object",
      method: "POST",
    });
    const schema = z.object({ title: z.string(), steps: z.array(z.string()) });
    const partials: unknown[] = [];
    const stream = new ObjectStream({ request, schema, protocol: textObjectProtocol() });
    stream.subscribe(() => partials.push(stream.getSnapshot().object));

    await stream.submit({ topic: "my day" });

    const { object, status, error } = stream.getSnapshot();
    expect(error).toBeUndefined();
    expect(status).toBe("ready");
    expect(object).toEqual({ title: "Plan", steps: ["wake up", "write tests"] });
    expect(partials.length).toBeGreaterThan(2);
    expectTypeOf(object).toEqualTypeOf<{ title?: string; steps?: string[] } | undefined>();
  });
});

describe("E2E types [ AI SDK ]", () => {
  it("should derive chat types from the server's UIMessage", () => {
    expectTypeOf<ChatTypes["metadata"]>().toEqualTypeOf<{ model: string }>();
    expectTypeOf<ChatTypes["data"]>().toEqualTypeOf<{ weather: { city: string; status: "loading" | "done" } }>();
    expectTypeOf<ChatTypes["tools"]["getWeather"]["input"]>().toEqualTypeOf<{ city: string }>();
    expectTypeOf<ChatTypes["tools"]["getWeather"]["output"]>().toEqualTypeOf<{ city: string; temperature: number }>();
    expectTypeOf<ChatTypes["tools"]["askConfirmation"]["output"]>().toEqualTypeOf<{ confirmed: boolean }>();
  });

  it("should reject wrong tool results at compile time", () => {
    const chat = createChat();
    const assertTypes = () => {
      chat.addToolResult({ tool: "askConfirmation", toolCallId: "x", output: { confirmed: true } });
      // @ts-expect-error - wrong output type
      chat.addToolResult({ tool: "askConfirmation", toolCallId: "x", output: { confirmed: "yes" } });
      // @ts-expect-error - unknown tool
      chat.addToolResult({ tool: "unknown", toolCallId: "x", output: {} });
    };
    expect(assertTypes).toBeTypeOf("function");
  });
});

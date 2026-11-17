import type { AISDKStreamChunkType, ChatMessageType, ChatStreamEventType } from "@hyper-fetch/ai";
import {
  aguiProtocol,
  aiSDKProtocol,
  aiSDKTextAnswer,
  Chat,
  encodeAGUIStream,
  encodeAISDKStream,
  lastAssistantMessageIsCompleteWithToolCalls,
  splitIntoChunks,
} from "@hyper-fetch/ai";

import { aiSDK, createMockedEndpoint, deferred } from "./chat.utils";

type ToolChat = {
  metadata: { model: string };
  data: { progress: { percent: number } };
  state: { count: number; items: string[] };
  tools: {
    getWeather: { input: { city: string }; output: { temperature: number } };
    getTime: { input: { zone: string }; output: string };
    confirm: { input: { question: string }; output: { confirmed: boolean } };
  };
};

const textOf = (message: ChatMessageType<any> | undefined) =>
  message?.parts.map((part) => (part.type === "text" ? part.text : "")).join("");

const toolsOf = (message: ChatMessageType<any> | undefined) =>
  (message?.parts ?? []).filter((part) => part.type === "tool") as Record<string, unknown>[];

const onFirst = (type: ChatStreamEventType["type"]) => {
  const seen = deferred();
  return { seen: seen.promise, onEvent: (event: ChatStreamEventType) => event.type === type && seen.resolve() };
};

const toolStep = (calls: { id: string; name: string; input: unknown }[]): AISDKStreamChunkType[] => [
  { type: "start", messageId: "a-1" },
  { type: "start-step" },
  ...calls.map((call) => ({
    type: "tool-input-available",
    toolCallId: call.id,
    toolName: call.name,
    input: call.input,
  })),
  { type: "finish-step" },
  { type: "finish", finishReason: "tool-calls" },
];

/** A rich stream that touches most part types - used to check that chunk boundaries never matter. */
const richStream: AISDKStreamChunkType[] = [
  { type: "start", messageId: "rich-1", messageMetadata: { model: "test-model" } },
  { type: "start-step" },
  { type: "reasoning-start", id: "r1" },
  { type: "reasoning-delta", id: "r1", delta: "Let me think… 🤔" },
  { type: "reasoning-end", id: "r1" },
  { type: "tool-input-start", toolCallId: "c1", toolName: "getWeather" },
  { type: "tool-input-delta", toolCallId: "c1", inputTextDelta: '{"city":"Kra' },
  { type: "tool-input-delta", toolCallId: "c1", inputTextDelta: 'ków"}' },
  {
    type: "tool-input-available",
    toolCallId: "c1",
    toolName: "getWeather",
    input: { city: "Kraków" },
    providerExecuted: true,
  },
  { type: "tool-output-available", toolCallId: "c1", output: { temperature: 21 } },
  { type: "source-url", sourceId: "s1", url: "https://example.com/a?b=c&d=é", title: "Źródło" },
  { type: "data-progress", id: "p1", data: { percent: 50 } },
  { type: "data-progress", id: "p1", data: { percent: 100 } },
  { type: "finish-step" },
  { type: "start-step" },
  { type: "text-start", id: "t1" },
  { type: "text-delta", id: "t1", delta: 'It is 21°C in Kraków — "sunny"\n\n' },
  { type: "text-delta", id: "t1", delta: "data: not an event\\n 日本語 🚀" },
  { type: "text-end", id: "t1" },
  { type: "finish-step" },
  { type: "finish", finishReason: "stop", messageMetadata: { model: "test-model-2" } },
];

describe("Chat [ Robustness ]", () => {
  describe("when the stream is split at arbitrary positions", () => {
    const run = async (chunks: string[]) => {
      const { request } = createMockedEndpoint([{ chunks }]);
      const onFinish = vi.fn();
      const chat = new Chat<ToolChat>({ request, protocol: aiSDKProtocol(), generateId: () => "fixed", onFinish });
      await chat.sendMessage("Hi");
      return { messages: chat.messages, status: chat.status, finish: onFinish.mock.calls[0][0].finishReason };
    };

    it("should build the same message for every chunk size", async () => {
      const encoded = encodeAISDKStream(richStream);
      const reference = await run(encoded);

      expect(reference.status).toBe("ready");
      expect(reference.finish).toBe("stop");
      expect(reference.messages[1].metadata).toEqual({ model: "test-model-2" });
      expect(reference.messages[1].parts.map((part) => part.type)).toEqual([
        "step-start",
        "reasoning",
        "tool",
        "source",
        "data",
        "step-start",
        "text",
      ]);

      for (const size of [1, 2, 3, 5, 8, 13, 64, 1000]) {
        // eslint-disable-next-line no-await-in-loop
        expect(await run(splitIntoChunks(encoded, size))).toEqual(reference);
      }
    });

    it("should build the same message when the whole stream arrives at once without a final blank line", async () => {
      const encoded = encodeAISDKStream(richStream, { done: false });
      const reference = await run(encoded);
      expect(await run([encoded.join("").trimEnd()])).toEqual(reference);
    });

    it("should build the same message with CRLF line endings", async () => {
      const encoded = encodeAISDKStream(richStream);
      const reference = await run(encoded);
      const crlf = encoded.join("").replaceAll("\n", "\r\n");
      for (const size of [1, 2, 7, crlf.length]) {
        // eslint-disable-next-line no-await-in-loop
        expect(await run(splitIntoChunks([crlf], size))).toEqual(reference);
      }
    });

    it("should ignore keep-alive comments and unknown event fields between events", async () => {
      const encoded = encodeAISDKStream(richStream);
      const reference = await run(encoded);
      const noisy = encoded.flatMap((chunk, index) => [
        ": keep-alive\n\n",
        index % 2 === 0 ? `id: ${index}\nretry: 1000\n${chunk}` : chunk,
      ]);
      expect(await run(noisy)).toEqual(reference);
    });
  });

  describe("when several chats share one request", () => {
    it("should keep their streams apart", async () => {
      const { request } = createMockedEndpoint(
        [aiSDK(aiSDKTextAnswer("alpha beta gamma delta")), aiSDK(aiSDKTextAnswer("one two three four"))],
        { chunkTime: 1 },
      );
      const first = new Chat({ request, protocol: aiSDKProtocol() });
      const second = new Chat({ request, protocol: aiSDKProtocol() });

      await Promise.all([first.sendMessage("a"), second.sendMessage("b")]);

      expect(textOf(first.messages[1])).toBe("alpha beta gamma delta");
      expect(textOf(second.messages[1])).toBe("one two three four");
    });

    it("should only stop its own stream", async () => {
      const { request } = createMockedEndpoint(
        [aiSDK(aiSDKTextAnswer("alpha beta gamma delta")), aiSDK(aiSDKTextAnswer("one two three four"))],
        { chunkTime: 1 },
      );
      const { seen, onEvent } = onFirst("text-delta");
      const first = new Chat({ request, protocol: aiSDKProtocol(), onEvent });
      const second = new Chat({ request, protocol: aiSDKProtocol() });

      const sentFirst = first.sendMessage("a");
      const sentSecond = second.sendMessage("b");
      await seen;
      first.stop();
      await Promise.all([sentFirst, sentSecond]);

      expect(textOf(first.messages[1])).toBe("alpha ");
      expect(textOf(second.messages[1])).toBe("one two three four");
      expect(second.status).toBe("ready");
    });

    it("should stop a chat that waits in the queue behind another one", async () => {
      const endpoint = createMockedEndpoint(
        [aiSDK(aiSDKTextAnswer("alpha beta gamma delta")), aiSDK(aiSDKTextAnswer("never shown"))],
        { chunkTime: 1 },
      );
      const request = endpoint.request.setQueued(true);
      const first = new Chat({ request, protocol: aiSDKProtocol() });
      const second = new Chat({ request, protocol: aiSDKProtocol() });

      const sentFirst = first.sendMessage("a");
      const sentSecond = second.sendMessage("b");
      second.stop();
      await Promise.all([sentFirst, sentSecond]);

      expect(endpoint.calls).toHaveLength(1);
      expect(textOf(first.messages[1])).toBe("alpha beta gamma delta");
      expect(second.status).toBe("ready");
      expect(second.messages).toHaveLength(1);
    });
  });

  describe("when client tools run", () => {
    it("should wait for every tool of a step before continuing", async () => {
      const { request, calls } = createMockedEndpoint([
        aiSDK(
          toolStep([
            { id: "c1", name: "getWeather", input: { city: "Oslo" } },
            { id: "c2", name: "getTime", input: { zone: "CET" } },
          ]),
        ),
        aiSDK(aiSDKTextAnswer("Done")),
      ]);
      const weather = deferred<{ temperature: number }>();
      const time = deferred<string>();
      const chat = new Chat<ToolChat>({
        request,
        protocol: aiSDKProtocol(),
        tools: { getWeather: { execute: () => weather.promise }, getTime: { execute: () => time.promise } },
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
      });

      await chat.sendMessage("Go");
      time.resolve("12:00");
      await vi.waitFor(() => expect(toolsOf(chat.messages[1])[1]).toMatchObject({ state: "output-available" }));
      expect(calls).toHaveLength(1);
      expect(chat.status).toBe("ready");

      weather.resolve({ temperature: 3 });
      await vi.waitFor(() => expect(calls).toHaveLength(2));
      await vi.waitFor(() => expect(chat.status).toBe("ready"));

      expect(toolsOf(chat.messages[1]).map((part) => part.output)).toEqual([{ temperature: 3 }, "12:00"]);
      expect(textOf(chat.messages[1])).toBe("Done");
    });

    it("should continue when one tool fails and another succeeds", async () => {
      const { request, calls } = createMockedEndpoint([
        aiSDK(
          toolStep([
            { id: "c1", name: "getWeather", input: { city: "Oslo" } },
            { id: "c2", name: "getTime", input: { zone: "CET" } },
          ]),
        ),
        aiSDK(aiSDKTextAnswer("Done")),
      ]);
      const chat = new Chat<ToolChat>({
        request,
        protocol: aiSDKProtocol(),
        tools: {
          getWeather: {
            execute: () => {
              throw new Error("No weather today");
            },
          },
          getTime: { execute: async () => "12:00" },
        },
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
      });

      await chat.sendMessage("Go");
      await vi.waitFor(() => expect(calls).toHaveLength(2));
      await vi.waitFor(() => expect(chat.status).toBe("ready"));

      expect(toolsOf(chat.messages[1])).toEqual([
        expect.objectContaining({ state: "output-error", errorText: "No weather today" }),
        expect.objectContaining({ state: "output-available", output: "12:00" }),
      ]);
    });

    it("should turn a non-Error throw into an error text", async () => {
      const { request } = createMockedEndpoint([
        aiSDK(toolStep([{ id: "c1", name: "getTime", input: { zone: "CET" } }])),
      ]);
      const chat = new Chat<ToolChat>({
        request,
        protocol: aiSDKProtocol(),
        tools: {
          getTime: {
            execute: () => {
              // eslint-disable-next-line @typescript-eslint/only-throw-error, no-throw-literal
              throw "plain string";
            },
          },
        },
      });

      await chat.sendMessage("Go");
      await vi.waitFor(() =>
        expect(toolsOf(chat.messages[1])[0]).toMatchObject({ state: "output-error", errorText: "plain string" }),
      );
    });

    it("should report a failing onToolCall as a tool error", async () => {
      const { request } = createMockedEndpoint([
        aiSDK(toolStep([{ id: "c1", name: "getTime", input: { zone: "CET" } }])),
      ]);
      const chat = new Chat<ToolChat>({
        request,
        protocol: aiSDKProtocol(),
        onToolCall: () => {
          throw new Error("Handler broke");
        },
      });

      await chat.sendMessage("Go");
      await vi.waitFor(() =>
        expect(toolsOf(chat.messages[1])[0]).toMatchObject({ state: "output-error", errorText: "Handler broke" }),
      );
    });

    it("should let onToolCall answer with addToolResult", async () => {
      const { request, calls } = createMockedEndpoint([
        aiSDK(toolStep([{ id: "c1", name: "getTime", input: { zone: "CET" } }])),
        aiSDK(aiSDKTextAnswer("It is noon")),
      ]);
      const chat: Chat<ToolChat> = new Chat<ToolChat>({
        request,
        protocol: aiSDKProtocol(),
        onToolCall: (toolCall) => {
          if (toolCall.toolName === "getTime") {
            chat.addToolResult({ tool: "getTime", toolCallId: toolCall.toolCallId, output: "12:00" });
          }
        },
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
      });

      await chat.sendMessage("Go");
      await vi.waitFor(() => expect(calls).toHaveLength(2));
      await vi.waitFor(() => expect(chat.status).toBe("ready"));

      expect(toolsOf(chat.messages[1])[0]).toMatchObject({ state: "output-available", output: "12:00" });
      expect(textOf(chat.messages[1])).toBe("It is noon");
    });

    it("should not run tools the backend executes itself", async () => {
      const { request } = createMockedEndpoint([
        aiSDK([
          { type: "start" },
          { type: "start-step" },
          {
            type: "tool-input-available",
            toolCallId: "c1",
            toolName: "getTime",
            input: { zone: "CET" },
            providerExecuted: true,
          },
          { type: "tool-output-available", toolCallId: "c1", output: "12:00" },
          { type: "finish", finishReason: "stop" },
        ]),
      ]);
      const execute = vi.fn();
      const onToolCall = vi.fn();
      const chat = new Chat<ToolChat>({
        request,
        protocol: aiSDKProtocol(),
        tools: { getTime: { execute } },
        onToolCall,
      });

      await chat.sendMessage("Go");

      expect(execute).not.toHaveBeenCalled();
      expect(onToolCall).not.toHaveBeenCalled();
      expect(toolsOf(chat.messages[1])[0]).toMatchObject({ state: "output-available", output: "12:00" });
    });

    it("should ignore a result for an unknown tool call", async () => {
      const { request, calls } = createMockedEndpoint([aiSDK(aiSDKTextAnswer("Hello"))]);
      const chat = new Chat<ToolChat>({
        request,
        protocol: aiSDKProtocol(),
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
      });
      await chat.sendMessage("Hi");
      const before = chat.messages;

      chat.addToolResult({ tool: "getTime", toolCallId: "missing", output: "12:00" });
      chat.addToolApprovalResponse({ id: "missing", approved: true });

      expect(chat.messages).toBe(before);
      expect(calls).toHaveLength(1);
    });

    it("should keep a tool result that arrives while the next answer already streams", async () => {
      const { request } = createMockedEndpoint(
        [
          aiSDK(toolStep([{ id: "c1", name: "getTime", input: { zone: "CET" } }])),
          aiSDK(aiSDKTextAnswer("one two three four")),
        ],
        { chunkTime: 1 },
      );
      const time = deferred<string>();
      const chat = new Chat<ToolChat>({
        request,
        protocol: aiSDKProtocol(),
        tools: { getTime: { execute: () => time.promise } },
      });

      await chat.sendMessage("Go");
      const { seen, onEvent } = onFirst("text-delta");
      chat.setOptions({ onEvent });
      const next = chat.sendMessage("Never mind, tell me a story");
      await seen;
      time.resolve("12:00");
      await next;

      expect(toolsOf(chat.messages[1])[0]).toMatchObject({ state: "output-available", output: "12:00" });
      expect(textOf(chat.messages[3])).toBe("one two three four");
    });
  });

  describe("when the backend reuses ids", () => {
    it("should give the result of a client tool to the latest call with that id", async () => {
      const { request } = createMockedEndpoint([
        aiSDK([
          { type: "start", messageId: "a-1" },
          { type: "start-step" },
          {
            type: "tool-input-available",
            toolCallId: "call_0",
            toolName: "getTime",
            input: { zone: "CET" },
            providerExecuted: true,
          },
          { type: "tool-output-available", toolCallId: "call_0", output: "12:00" },
          { type: "finish-step" },
          { type: "start-step" },
          { type: "tool-input-available", toolCallId: "call_0", toolName: "getWeather", input: { city: "Oslo" } },
          { type: "finish-step" },
          { type: "finish", finishReason: "tool-calls" },
        ]),
      ]);
      const chat = new Chat<ToolChat>({
        request,
        protocol: aiSDKProtocol(),
        tools: { getWeather: { execute: async () => ({ temperature: 7 }) } },
      });

      await chat.sendMessage("Go");
      await vi.waitFor(() => expect(toolsOf(chat.messages[1])[1]).toMatchObject({ state: "output-available" }));

      expect(toolsOf(chat.messages[1])).toEqual([
        expect.objectContaining({ toolName: "getTime", state: "output-available", output: "12:00" }),
        expect.objectContaining({ toolName: "getWeather", state: "output-available", output: { temperature: 7 } }),
      ]);
    });
  });

  describe("when the backend reports usage", () => {
    const run = (runId: string, usage: Record<string, number>[], text: string) => [
      { type: "TEXT_MESSAGE_CONTENT", messageId: `m-${runId}`, delta: text },
      { type: "RUN_FINISHED", threadId: "t", runId, usage },
    ];

    it("should add up the usage of every run in one response", async () => {
      const { request } = createMockedEndpoint([
        {
          chunks: encodeAGUIStream([
            { type: "RUN_STARTED", threadId: "t", runId: "r1" },
            ...run("r1", [{ inputTokens: 10, outputTokens: 2, totalTokens: 12 }], "Thinking"),
            ...run("r1", [{ inputTokens: 20, outputTokens: 5, totalTokens: 25, reasoningTokens: 3 }], "Done"),
          ]),
        },
      ]);
      const onFinish = vi.fn();
      const chat = new Chat({ request, protocol: aguiProtocol(), onFinish });

      await chat.sendMessage("Go");

      const total = { inputTokens: 30, outputTokens: 7, totalTokens: 37, reasoningTokens: 3 };
      expect(chat.getSnapshot().usage).toEqual(total);
      expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ usage: total }));
    });

    it("should start counting again with every request", async () => {
      const { request } = createMockedEndpoint([
        {
          chunks: encodeAGUIStream([
            { type: "RUN_STARTED", threadId: "t", runId: "r1" },
            ...run("r1", [{ inputTokens: 10 }], "One"),
          ]),
        },
        {
          chunks: encodeAGUIStream([
            { type: "RUN_STARTED", threadId: "t", runId: "r2" },
            ...run("r2", [{ inputTokens: 4 }], "Two"),
          ]),
        },
      ]);
      const chat = new Chat({ request, protocol: aguiProtocol() });

      await chat.sendMessage("One");
      expect(chat.getSnapshot().usage).toEqual({ inputTokens: 10 });
      await chat.sendMessage("Two");
      expect(chat.getSnapshot().usage).toEqual({ inputTokens: 4 });
    });

    it("should not count the usage of a failed attempt when the request retries", async () => {
      const { request } = createMockedEndpoint([
        {
          error: { message: "dropped" },
          status: 500,
          chunks: encodeAGUIStream([
            { type: "RUN_STARTED", threadId: "t", runId: "r1" },
            ...run("r1", [{ inputTokens: 99 }], "Lost"),
          ]),
        },
        {
          chunks: encodeAGUIStream([
            { type: "RUN_STARTED", threadId: "t", runId: "r1" },
            ...run("r1", [{ inputTokens: 4 }], "Kept"),
          ]),
        },
      ]);
      const chat = new Chat({ request: request.setRetry(1).setRetryTime(0), protocol: aguiProtocol() });

      await chat.sendMessage("Go");

      expect(chat.getSnapshot().usage).toEqual({ inputTokens: 4 });
    });
  });

  describe("when callbacks misbehave", () => {
    it("should fail the request when onEvent throws", async () => {
      const { request } = createMockedEndpoint([aiSDK(aiSDKTextAnswer("one two three"))]);
      const failure = new Error("Broken handler");
      const onError = vi.fn();
      const chat = new Chat({
        request,
        protocol: aiSDKProtocol(),
        onError,
        onEvent: (event) => {
          if (event.type === "text-delta") {
            throw failure;
          }
        },
      });

      await chat.sendMessage("Hi");

      expect(chat.status).toBe("error");
      expect(chat.error).toBe(failure);
      expect(onError).toHaveBeenCalledWith(failure);
    });

    it("should fail the request when onData throws", async () => {
      const { request } = createMockedEndpoint([
        aiSDK([{ type: "start" }, { type: "data-progress", data: { percent: 1 } }, { type: "finish" }]),
      ]);
      const chat = new Chat<ToolChat>({
        request,
        protocol: aiSDKProtocol(),
        onData: () => {
          throw new Error("Broken data handler");
        },
      });

      await chat.sendMessage("Hi");

      expect(chat.status).toBe("error");
      expect((chat.error as Error).message).toBe("Broken data handler");
    });

    it("should be usable again after a failing callback", async () => {
      const { request } = createMockedEndpoint([aiSDK(aiSDKTextAnswer("one")), aiSDK(aiSDKTextAnswer("two"))]);
      let shouldThrow = true;
      const chat = new Chat({
        request,
        protocol: aiSDKProtocol(),
        onEvent: () => {
          if (shouldThrow) {
            throw new Error("Broken handler");
          }
        },
      });

      await chat.sendMessage("Hi");
      expect(chat.status).toBe("error");
      shouldThrow = false;
      await chat.regenerate();

      expect(chat.status).toBe("ready");
      expect(textOf(chat.messages.at(-1))).toBe("two");
    });

    it("should let a listener unsubscribe while it is being notified", async () => {
      const { request } = createMockedEndpoint([aiSDK(aiSDKTextAnswer("one two"))]);
      const chat = new Chat({ request, protocol: aiSDKProtocol() });
      const second = vi.fn();
      const unsubscribe = chat.subscribe(() => unsubscribe());
      chat.subscribe(second);

      await chat.sendMessage("Hi");

      expect(second).toHaveBeenCalled();
      expect(chat.status).toBe("ready");
    });
  });

  describe("when sending messages", () => {
    it.each([
      ["a string", "Hello", [{ type: "text", text: "Hello", state: "done" }]],
      ["text", { text: "Hello" }, [{ type: "text", text: "Hello", state: "done" }]],
      [
        "text and parts",
        { text: "Look", parts: [{ type: "file" as const, url: "data:image/png;base64,AA==", mediaType: "image/png" }] },
        [
          { type: "text", text: "Look", state: "done" },
          { type: "file", url: "data:image/png;base64,AA==", mediaType: "image/png" },
        ],
      ],
      ["an empty object", {}, []],
    ])("should build the user message from %s", async (_name, input, parts) => {
      const { request } = createMockedEndpoint([aiSDK(aiSDKTextAnswer("ok"))]);
      const chat = new Chat({ request, protocol: aiSDKProtocol() });

      await chat.sendMessage(input as never);

      expect(chat.messages[0].role).toBe("user");
      expect(chat.messages[0].parts).toEqual(parts.map((part) => expect.objectContaining(part)));
    });

    it("should use a custom id and metadata", async () => {
      const { request } = createMockedEndpoint([aiSDK(aiSDKTextAnswer("ok"))]);
      const chat = new Chat<ToolChat>({ request, protocol: aiSDKProtocol() });

      await chat.sendMessage({ id: "user-1", text: "Hi", metadata: { model: "m" } });

      expect(chat.messages[0]).toMatchObject({ id: "user-1", metadata: { model: "m" } });
    });

    it("should give every message and part a unique id", async () => {
      const { request } = createMockedEndpoint([aiSDK(aiSDKTextAnswer("ok"))]);
      const chat = new Chat({ request, protocol: aiSDKProtocol() });

      for (let i = 0; i < 20; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await chat.sendMessage(`message ${i}`);
      }

      const ids = chat.messages.map((message) => message.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(chat.messages).toHaveLength(40);
    });

    it("should keep earlier messages identical while a new one streams", async () => {
      const { request } = createMockedEndpoint([
        aiSDK(aiSDKTextAnswer("first")),
        aiSDK(aiSDKTextAnswer("one two three")),
      ]);
      const chat = new Chat({ request, protocol: aiSDKProtocol() });
      await chat.sendMessage("a");
      const [user, assistant] = chat.messages;
      const seen: ChatMessageType[][] = [];
      chat.subscribe(() => seen.push(chat.messages as ChatMessageType[]));

      await chat.sendMessage("b");

      expect(seen.length).toBeGreaterThan(3);
      seen.forEach((messages) => {
        expect(messages[0]).toBe(user);
        expect(messages[1]).toBe(assistant);
      });
    });

    it("should return the same snapshot until something changes", async () => {
      const { request } = createMockedEndpoint([aiSDK(aiSDKTextAnswer("ok"))]);
      const chat = new Chat({ request, protocol: aiSDKProtocol() });
      const before = chat.getSnapshot();
      expect(chat.getSnapshot()).toBe(before);
      chat.clearError();
      chat.stop();
      expect(chat.getSnapshot()).toBe(before);

      await chat.sendMessage("Hi");
      const after = chat.getSnapshot();
      expect(after).not.toBe(before);
      expect(chat.getSnapshot()).toBe(after);
    });
  });

  describe("when the backend shares state", () => {
    it("should apply deltas on top of state set by the client while streaming", async () => {
      const { request, calls } = createMockedEndpoint(
        [
          {
            chunks: encodeAGUIStream([
              { type: "RUN_STARTED", threadId: "t", runId: "r" },
              { type: "TEXT_MESSAGE_CONTENT", messageId: "m", delta: "Working" },
              { type: "STATE_DELTA", delta: [{ op: "add", path: "/items/-", value: "from server" }] },
              { type: "RUN_FINISHED", threadId: "t", runId: "r" },
            ]),
          },
          { chunks: encodeAGUIStream([{ type: "RUN_STARTED", threadId: "t", runId: "r2" }]) },
        ],
        { chunkTime: 1 },
      );
      const { seen, onEvent } = onFirst("text-delta");
      const chat = new Chat<ToolChat>({
        request,
        protocol: aguiProtocol(),
        state: { count: 0, items: [] },
        onEvent,
      });

      const sent = chat.sendMessage("Go");
      await seen;
      chat.setState((state) => ({ count: (state?.count ?? 0) + 1, items: ["from client"] }));
      await sent;

      expect(chat.state).toEqual({ count: 1, items: ["from client", "from server"] });

      await chat.sendMessage("Again");
      expect(calls[1].payload.state).toEqual({ count: 1, items: ["from client", "from server"] });
    });

    it("should never mutate the state object it was given", async () => {
      const { request } = createMockedEndpoint([
        {
          chunks: encodeAGUIStream([
            { type: "RUN_STARTED", threadId: "t", runId: "r" },
            { type: "STATE_DELTA", delta: [{ op: "add", path: "/items/-", value: "x" }] },
            { type: "STATE_DELTA", delta: [{ op: "replace", path: "/count", value: 5 }] },
            { type: "RUN_FINISHED", threadId: "t", runId: "r" },
          ]),
        },
      ]);
      const initial = Object.freeze({ count: 0, items: Object.freeze([]) as unknown as string[] });
      const chat = new Chat<ToolChat>({ request, protocol: aguiProtocol(), state: initial });

      await chat.sendMessage("Go");

      expect(chat.status).toBe("ready");
      expect(chat.state).toEqual({ count: 5, items: ["x"] });
      expect(initial).toEqual({ count: 0, items: [] });
    });
  });

  describe("when resuming", () => {
    it("should stay ready when there is no stream to resume", async () => {
      const { request } = createMockedEndpoint([aiSDK([])]);
      const resume = createMockedEndpoint([{ chunks: [], status: 204 }]);
      const onFinish = vi.fn();
      const chat = new Chat({ request, protocol: aiSDKProtocol(), resumeRequest: resume.request, onFinish });

      await chat.resumeStream();

      expect(chat.status).toBe("ready");
      expect(chat.messages).toEqual([]);
      expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ message: undefined, isError: false }));
    });

    it("should continue the last assistant message", async () => {
      const { request } = createMockedEndpoint([aiSDK([])]);
      const resume = createMockedEndpoint([
        aiSDK([
          { type: "start", messageId: "a-1" },
          { type: "text-start", id: "t2" },
          { type: "text-delta", id: "t2", delta: " and the rest" },
          { type: "text-end", id: "t2" },
          { type: "finish", finishReason: "stop" },
        ]),
      ]);
      const chat = new Chat({
        request,
        protocol: aiSDKProtocol(),
        resumeRequest: resume.request,
        messages: [
          { id: "u-1", role: "user", parts: [{ type: "text", id: "ut", text: "Hi", state: "done" }] },
          { id: "a-1", role: "assistant", parts: [{ type: "text", id: "t1", text: "The start", state: "done" }] },
        ],
      });

      await chat.resumeStream();

      expect(chat.messages).toHaveLength(2);
      expect(chat.messages[1].id).toBe("a-1");
      expect(textOf(chat.messages[1])).toBe("The start and the rest");
    });

    it("should report a failed resume as an error and keep the messages", async () => {
      const { request } = createMockedEndpoint([aiSDK([])]);
      const resume = createMockedEndpoint([{ error: { message: "Gone" }, status: 410 }]);
      const messages: ChatMessageType[] = [{ id: "u-1", role: "user", parts: [] }];
      const chat = new Chat({ request, protocol: aiSDKProtocol(), resumeRequest: resume.request, messages });

      await chat.resumeStream();

      expect(chat.status).toBe("error");
      expect(chat.error).toEqual({ message: "Gone" });
      expect(chat.messages).toBe(messages);
    });
  });
});

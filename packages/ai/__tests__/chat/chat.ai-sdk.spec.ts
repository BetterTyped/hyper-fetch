import type { ChatMessageType, ChatStreamEventType } from "@hyper-fetch/ai";
import {
  aiSDKProtocol,
  aiSDKTextAnswer,
  aiSDKTextProtocol,
  Chat,
  ChatStreamError,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  lastAssistantMessageIsCompleteWithToolCalls,
  SchemaValidationError,
} from "@hyper-fetch/ai";
import { z } from "zod";

import { aiSDK, createMockedEndpoint, unterminated } from "./chat.utils";

type WeatherChat = {
  metadata: { model: string };
  data: { weather: { city: string; temperature: number }; toast: string };
  tools: {
    getWeather: { input: { city: string }; output: { temperature: number } };
    askLocation: { input: { question: string }; output: { city: string } };
    pay: { input: { amount: number }; output: { ok: boolean } };
  };
};

const textOf = (message: ChatMessageType<any> | undefined) =>
  message?.parts.map((part) => (part.type === "text" ? part.text : "")).join("");

describe("Chat [ AI SDK protocol ]", () => {
  it("should stream an answer and go through every status", async () => {
    const { request, calls } = createMockedEndpoint([aiSDK(aiSDKTextAnswer("Hello there!", { messageId: "srv-1" }))]);
    const statuses: string[] = [];
    const onFinish = vi.fn();
    const chat = new Chat({ id: "chat-1", request, protocol: aiSDKProtocol(), onFinish });
    chat.subscribe(() => {
      if (statuses.at(-1) !== chat.status) {
        statuses.push(chat.status);
      }
    });

    await chat.sendMessage("Hi");

    // "ready" first: the user message is added before the request starts
    expect(statuses).toEqual(["ready", "submitted", "streaming", "ready"]);
    expect(chat.messages).toHaveLength(2);
    expect(chat.messages[0]).toMatchObject({ role: "user", parts: [{ type: "text", text: "Hi", state: "done" }] });
    expect(chat.messages[1]).toMatchObject({ id: "srv-1", role: "assistant" });
    expect(textOf(chat.messages[1])).toBe("Hello there!");
    expect(chat.messages[1].parts.find((part) => part.type === "text")).toMatchObject({ state: "done" });

    expect(calls).toHaveLength(1);
    expect(calls[0].payload).toEqual({
      id: "chat-1",
      messages: [{ id: chat.messages[0].id, role: "user", parts: [{ type: "text", text: "Hi", state: "done" }] }],
      trigger: "submit-message",
      messageId: undefined,
    });
    expect(onFinish).toHaveBeenCalledWith(
      expect.objectContaining({ isAbort: false, isError: false, finishReason: "stop", message: chat.messages[1] }),
    );
  });

  it("should send extra body fields from options and from the call", async () => {
    const { request, calls } = createMockedEndpoint([aiSDK(aiSDKTextAnswer("ok"))]);
    const chat = new Chat({ request, protocol: aiSDKProtocol(), body: () => ({ model: "fast" }) });

    await chat.sendMessage({ text: "Hi", metadata: undefined }, { body: { temperature: 0 } });

    expect(calls[0].payload).toMatchObject({ model: "fast", temperature: 0, trigger: "submit-message" });
  });

  it("should accept messages with custom parts and metadata", async () => {
    const { request, calls } = createMockedEndpoint([aiSDK(aiSDKTextAnswer("ok"))]);
    const chat = new Chat<WeatherChat>({ request, protocol: aiSDKProtocol() });

    await chat.sendMessage({
      id: "u-1",
      text: "What is this?",
      parts: [{ type: "file", url: "https://x.com/a.png", mediaType: "image/png" }],
      metadata: { model: "vision" },
    });

    expect(calls[0].payload.messages[0]).toEqual({
      id: "u-1",
      role: "user",
      metadata: { model: "vision" },
      parts: [
        { type: "text", text: "What is this?", state: "done" },
        { type: "file", url: "https://x.com/a.png", mediaType: "image/png" },
      ],
    });
  });

  it("should not send while a request is in progress", async () => {
    const { request, calls } = createMockedEndpoint([aiSDK(aiSDKTextAnswer("slow answer"))], { chunkTime: 5 });
    const chat = new Chat({ request, protocol: aiSDKProtocol() });

    const first = chat.sendMessage("one");
    await chat.sendMessage("two");
    await chat.regenerate();
    await first;

    expect(calls).toHaveLength(1);
    expect(chat.messages.filter((message) => message.role === "user")).toHaveLength(1);
  });

  it("should run client tools and continue automatically in the same assistant message", async () => {
    const { request, calls } = createMockedEndpoint([
      aiSDK([
        { type: "start", messageId: "a-1" },
        { type: "start-step" },
        { type: "tool-input-start", toolCallId: "c1", toolName: "getWeather" },
        { type: "tool-input-delta", toolCallId: "c1", inputTextDelta: '{"city":"Oslo"}' },
        { type: "tool-input-available", toolCallId: "c1", toolName: "getWeather", input: { city: "Oslo" } },
        { type: "finish-step" },
        { type: "finish", finishReason: "tool-calls" },
      ]),
      aiSDK([
        { type: "start", messageId: "a-1" },
        { type: "start-step" },
        { type: "text-start", id: "t" },
        { type: "text-delta", id: "t", delta: "It is 7 degrees in Oslo" },
        { type: "text-end", id: "t" },
        { type: "finish-step" },
        { type: "finish", finishReason: "stop" },
      ]),
    ]);
    const execute = vi.fn(async ({ city }: { city: string }) => ({ temperature: city.length + 3 }));
    const onToolCall = vi.fn();
    const chat = new Chat<WeatherChat>({
      request,
      protocol: aiSDKProtocol(),
      tools: { getWeather: { execute } },
      onToolCall,
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    });

    await chat.sendMessage("Weather in Oslo?");
    await vi.waitFor(() => expect(calls).toHaveLength(2));
    await vi.waitFor(() => expect(chat.status).toBe("ready"));

    expect(onToolCall).toHaveBeenCalledWith({ toolName: "getWeather", toolCallId: "c1", input: { city: "Oslo" } });
    expect(execute).toHaveBeenCalledWith({ city: "Oslo" }, { toolCallId: "c1" });
    expect(calls[1].payload.messages[1].parts).toContainEqual({
      type: "tool-getWeather",
      toolCallId: "c1",
      state: "output-available",
      input: { city: "Oslo" },
      output: { temperature: 7 },
    });

    expect(chat.messages).toHaveLength(2);
    const assistant = chat.messages[1];
    expect(assistant.parts.map((part) => part.type)).toEqual(["step-start", "tool", "step-start", "text"]);
    expect(textOf(assistant)).toBe("It is 7 degrees in Oslo");
  });

  it("should stop sending automatically after maxAutomaticSends consecutive requests", async () => {
    // A backend that keeps asking for the same client tool forever
    const { request, calls } = createMockedEndpoint([
      aiSDK([
        { type: "start" },
        { type: "start-step" },
        { type: "tool-input-available", toolCallId: "loop", toolName: "getWeather", input: { city: "X" } },
        { type: "finish" },
      ]),
    ]);
    let counter = 0;
    const chat = new Chat<WeatherChat>({
      request,
      protocol: aiSDKProtocol(),
      generateId: () => {
        counter += 1;
        return `id-${counter}`;
      },
      tools: { getWeather: { execute: async () => ({ temperature: 1 }) } },
      sendAutomaticallyWhen: () => true,
      maxAutomaticSends: 3,
    });

    await chat.sendMessage("go");
    await vi.waitFor(() => expect(calls).toHaveLength(4));
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    expect(calls).toHaveLength(4);
    expect(chat.status).toBe("ready");
  });

  it("should validate client tool input and report execution errors as tool errors", async () => {
    const { request } = createMockedEndpoint([
      aiSDK([
        { type: "start" },
        { type: "tool-input-available", toolCallId: "c1", toolName: "getWeather", input: { city: 5 } },
        { type: "tool-input-available", toolCallId: "c2", toolName: "pay", input: { amount: 1 } },
        { type: "finish" },
      ]),
    ]);
    const chat = new Chat<WeatherChat>({
      request,
      protocol: aiSDKProtocol(),
      tools: {
        getWeather: { inputSchema: z.object({ city: z.string() }), execute: async () => ({ temperature: 1 }) },
        pay: {
          execute: async () => {
            throw new Error("Card declined");
          },
        },
      },
    });

    await chat.sendMessage("go");
    await vi.waitFor(() =>
      expect(chat.messages[1].parts.every((part) => part.type !== "tool" || part.state === "output-error")).toBe(true),
    );

    const [weather, pay] = chat.messages[1].parts;
    expect(weather).toMatchObject({ state: "output-error" });
    expect((weather as { errorText: string }).errorText).toContain("city");
    expect(pay).toMatchObject({ state: "output-error", errorText: "Card declined" });
  });

  it("should accept manual tool results typed by tool name", async () => {
    const { request, calls } = createMockedEndpoint([
      aiSDK([
        { type: "start" },
        { type: "tool-input-available", toolCallId: "c1", toolName: "askLocation", input: { question: "Where?" } },
        { type: "finish", finishReason: "tool-calls" },
      ]),
      aiSDK(aiSDKTextAnswer("Thanks")),
    ]);
    const chat = new Chat<WeatherChat>({
      request,
      protocol: aiSDKProtocol(),
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    });

    await chat.sendMessage("Where am I?");
    expect(calls).toHaveLength(1);

    chat.addToolResult({ tool: "askLocation", toolCallId: "c1", output: { city: "Paris" } });
    await vi.waitFor(() => expect(calls).toHaveLength(2));
    await vi.waitFor(() => expect(chat.status).toBe("ready"));

    expect(chat.messages[1].parts[0]).toMatchObject({ state: "output-available", output: { city: "Paris" } });
  });

  it("should not overwrite a manual result with a later automatic one", async () => {
    let resolveExecute: (value: { temperature: number }) => void = () => {};
    const { request } = createMockedEndpoint([
      aiSDK([
        { type: "start" },
        { type: "tool-input-available", toolCallId: "c1", toolName: "getWeather", input: { city: "A" } },
        { type: "finish" },
      ]),
    ]);
    const chat = new Chat<WeatherChat>({
      request,
      protocol: aiSDKProtocol(),
      tools: {
        getWeather: {
          execute: () =>
            new Promise((resolve) => {
              resolveExecute = resolve;
            }),
        },
      },
    });

    await chat.sendMessage("go");
    chat.addToolResult({ tool: "getWeather", toolCallId: "c1", output: { temperature: 1 } });
    resolveExecute({ temperature: 99 });
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });

    expect(chat.messages[1].parts[0]).toMatchObject({ output: { temperature: 1 } });
  });

  it("should handle tool approvals", async () => {
    const { request, calls } = createMockedEndpoint([
      aiSDK([
        { type: "start" },
        { type: "tool-input-available", toolCallId: "c1", toolName: "pay", input: { amount: 10 } },
        { type: "tool-approval-request", approvalId: "ap-1", toolCallId: "c1" },
        { type: "finish" },
      ]),
      aiSDK([
        { type: "start" },
        { type: "tool-output-available", toolCallId: "c1", output: { ok: true } },
        { type: "finish" },
      ]),
    ]);
    const chat = new Chat<WeatherChat>({
      request,
      protocol: aiSDKProtocol(),
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    });

    await chat.sendMessage("Pay 10");
    expect(chat.messages[1].parts[0]).toMatchObject({ state: "approval-requested", approval: { id: "ap-1" } });

    chat.addToolApprovalResponse({ id: "unknown", approved: true });
    chat.addToolApprovalResponse({ id: "ap-1", approved: true, reason: "ok" });
    await vi.waitFor(() => expect(calls).toHaveLength(2));
    await vi.waitFor(() => expect(chat.status).toBe("ready"));

    expect(calls[1].payload.messages[1].parts[0]).toEqual({
      type: "tool-pay",
      toolCallId: "c1",
      state: "approval-responded",
      input: { amount: 10 },
      approval: { id: "ap-1", approved: true, reason: "ok" },
    });
    expect(chat.messages[1].parts[0]).toMatchObject({ state: "output-available", output: { ok: true } });
  });

  it("should deliver typed data parts and keep only persistent ones", async () => {
    const { request } = createMockedEndpoint([
      aiSDK([
        { type: "start" },
        { type: "data-weather", id: "w", data: { city: "Oslo", temperature: 1 } },
        { type: "data-weather", id: "w", data: { city: "Oslo", temperature: 2 } },
        { type: "data-toast", data: "Saved", transient: true },
        { type: "finish" },
      ]),
    ]);
    const onData = vi.fn();
    const chat = new Chat<WeatherChat>({ request, protocol: aiSDKProtocol(), onData });

    await chat.sendMessage("go");

    expect(onData.mock.calls.map(([data]) => data)).toEqual([
      { name: "weather", id: "w", data: { city: "Oslo", temperature: 1 } },
      { name: "weather", id: "w", data: { city: "Oslo", temperature: 2 } },
      { name: "toast", data: "Saved", transient: true },
    ]);
    expect(chat.messages[1].parts).toEqual([
      { type: "data", name: "weather", id: "w", data: { city: "Oslo", temperature: 2 } },
    ]);
  });

  it("should validate data parts and metadata with schemas", async () => {
    const { request } = createMockedEndpoint([
      aiSDK([
        { type: "start", messageMetadata: { model: "a" } },
        { type: "data-weather", data: { city: 1 } },
        { type: "finish" },
      ]),
      aiSDK([{ type: "start", messageMetadata: { model: 5 } }, { type: "finish" }]),
    ]);
    const onError = vi.fn();
    const chat = new Chat<WeatherChat>({
      request,
      protocol: aiSDKProtocol(),
      onError,
      metadataSchema: z.object({ model: z.string() }),
      dataSchemas: { weather: z.object({ city: z.string(), temperature: z.number() }) },
    });

    await chat.sendMessage("one");
    expect(chat.status).toBe("error");
    expect(chat.error).toBeInstanceOf(SchemaValidationError);
    expect((chat.error as Error).message).toContain('Data part "weather"');
    expect(chat.messages[1].metadata).toEqual({ model: "a" });
    expect(chat.messages[1].parts).toEqual([]);

    chat.clearError();
    expect(chat.status).toBe("ready");
    await chat.sendMessage("two");
    expect((chat.error as Error).message).toContain("Message metadata");
    expect(onError).toHaveBeenCalledTimes(2);
  });

  it("should expose stream errors", async () => {
    const { request } = createMockedEndpoint([
      aiSDK([
        { type: "start" },
        { type: "text-delta", id: "t", delta: "par" },
        { type: "error", errorText: "Model overloaded" },
      ]),
    ]);
    const onError = vi.fn();
    const onFinish = vi.fn();
    const chat = new Chat({ request, protocol: aiSDKProtocol(), onError, onFinish });

    await chat.sendMessage("go");

    expect(chat.status).toBe("error");
    expect(chat.error).toBeInstanceOf(ChatStreamError);
    expect((chat.error as Error).message).toBe("Model overloaded");
    expect(textOf(chat.messages[1])).toBe("par");
    expect(onError).toHaveBeenCalledWith(chat.error);
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ isError: true }));
  });

  it("should expose HTTP errors from the request", async () => {
    const { request } = createMockedEndpoint([{ error: { message: "Unauthorized" }, status: 401 }]);
    const chat = new Chat({ request, protocol: aiSDKProtocol() });

    await chat.sendMessage("go");

    expect(chat.status).toBe("error");
    expect(chat.error).toEqual({ message: "Unauthorized" });
    expect(chat.messages).toHaveLength(1);
  });

  it("should fail on a malformed stream and stop the request", async () => {
    const { request } = createMockedEndpoint([{ chunks: ["data: {broken\n\n", 'data: {"type":"start"}\n\n'] }]);
    const chat = new Chat({ request, protocol: aiSDKProtocol() });

    await chat.sendMessage("go");

    expect(chat.status).toBe("error");
    expect((chat.error as Error).message).toContain("Invalid AI SDK stream chunk");
  });

  it("should stop streaming, keep the partial answer and report an abort", async () => {
    const { request } = createMockedEndpoint([aiSDK(aiSDKTextAnswer("one two three four five"))], { chunkTime: 5 });
    const onFinish = vi.fn();
    const deltas: string[] = [];
    let chat: Chat | null = null;
    const onEvent = (event: ChatStreamEventType) => {
      if (event.type !== "text-delta") {
        return;
      }
      deltas.push(event.delta);
      if (deltas.length === 2) {
        chat?.stop();
      }
    };
    chat = new Chat({ request, protocol: aiSDKProtocol(), onFinish, onEvent });

    await chat.sendMessage("count");

    expect(deltas).toEqual(["one ", "two "]);
    expect(chat.status).toBe("ready");
    expect(chat.error).toBeUndefined();
    expect(textOf(chat.messages[1])).toBe("one two ");
    expect(chat.messages[1].parts.find((part) => part.type === "text")).toMatchObject({ state: "done" });
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ isAbort: true, isError: false }));
  });

  it("should do nothing when stopping an idle chat", () => {
    const { request } = createMockedEndpoint([aiSDK([])]);
    const chat = new Chat({ request, protocol: aiSDKProtocol() });
    expect(() => chat.stop()).not.toThrow();
  });

  it("should regenerate the last answer", async () => {
    const { request, calls } = createMockedEndpoint([
      aiSDK(aiSDKTextAnswer("First", { messageId: "a1" })),
      aiSDK(aiSDKTextAnswer("Second", { messageId: "a2" })),
    ]);
    const chat = new Chat({ request, protocol: aiSDKProtocol() });

    await chat.sendMessage("Hi");
    await chat.regenerate();

    expect(calls[1].payload).toMatchObject({ trigger: "regenerate-message", messageId: "a1" });
    expect(calls[1].payload.messages).toHaveLength(1);
    expect(chat.messages.map((message) => message.id)).toEqual([chat.messages[0].id, "a2"]);
    expect(textOf(chat.messages[1])).toBe("Second");
  });

  it("should regenerate from a user message and ignore unknown ids", async () => {
    const { request, calls } = createMockedEndpoint([aiSDK(aiSDKTextAnswer("x"))]);
    const chat = new Chat({
      request,
      protocol: aiSDKProtocol(),
      messages: [
        { id: "u1", role: "user", parts: [] },
        { id: "a1", role: "assistant", parts: [] },
        { id: "u2", role: "user", parts: [] },
      ],
    });

    await chat.regenerate({ messageId: "missing" });
    expect(calls).toHaveLength(0);

    await chat.regenerate({ messageId: "u1" });
    expect(calls[0].payload).toMatchObject({ trigger: "regenerate-message", messageId: "u1" });
    expect(calls[0].payload.messages.map((message: { id: string }) => message.id)).toEqual(["u1"]);
  });

  it("should drop the partial answer of a failed attempt when the request retries", async () => {
    const { request, calls } = createMockedEndpoint([
      { error: { message: "dropped" }, status: 500, chunks: encodeChunks(aiSDKTextAnswer("broken answer")) },
      aiSDK(aiSDKTextAnswer("Fresh answer")),
    ]);
    const chat = new Chat({ request: request.setRetry(1).setRetryTime(0), protocol: aiSDKProtocol() });

    await chat.sendMessage("go");

    expect(calls).toHaveLength(2);
    expect(chat.status).toBe("ready");
    expect(chat.messages).toHaveLength(2);
    expect(textOf(chat.messages[1])).toBe("Fresh answer");
  });

  it("should not let a stream error from a failed attempt fail the retried answer", async () => {
    const { request, calls } = createMockedEndpoint([
      {
        error: { message: "dropped" },
        status: 500,
        chunks: encodeChunks([{ type: "start" }, { type: "error", errorText: "boom" }]),
      },
      aiSDK(aiSDKTextAnswer("Fresh answer")),
    ]);
    const onError = vi.fn();
    const onFinish = vi.fn();
    const chat = new Chat({
      request: request.setRetry(1).setRetryTime(0),
      protocol: aiSDKProtocol(),
      onError,
      onFinish,
    });

    await chat.sendMessage("go");

    expect(calls).toHaveLength(2);
    expect(chat.status).toBe("ready");
    expect(chat.error).toBeUndefined();
    expect(onError).not.toHaveBeenCalled();
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ isError: false, finishReason: "stop" }));
    expect(textOf(chat.messages[1])).toBe("Fresh answer");
  });

  it("should keep the last event when the stream ends without a final blank line", async () => {
    const chunks = unterminated(
      encodeChunks([
        { type: "start" },
        { type: "start-step" },
        { type: "text-start", id: "t1" },
        { type: "text-delta", id: "t1", delta: "Hello" },
        { type: "text-delta", id: "t1", delta: " world" },
      ]),
    );
    const { request } = createMockedEndpoint([{ chunks }]);
    const chat = new Chat({ request, protocol: aiSDKProtocol() });

    await chat.sendMessage("go");

    expect(chat.status).toBe("ready");
    expect(textOf(chat.messages[1])).toBe("Hello world");
  });

  it("should report the finish reason when the finish event is not terminated", async () => {
    const chunks = unterminated(encodeChunks(aiSDKTextAnswer("Hello world")));
    const { request } = createMockedEndpoint([{ chunks }]);
    const onFinish = vi.fn();
    const chat = new Chat({ request, protocol: aiSDKProtocol(), onFinish });

    await chat.sendMessage("go");

    expect(onFinish).toHaveBeenCalledWith(
      expect.objectContaining({ finishReason: "stop", isError: false, isAbort: false }),
    );
  });

  it("should run a client tool whose call is the last, unterminated event", async () => {
    const chunks = unterminated(
      encodeChunks([
        { type: "start" },
        { type: "start-step" },
        { type: "tool-input-available", toolCallId: "call-1", toolName: "getWeather", input: { city: "Oslo" } },
      ]),
    );
    const { request, calls } = createMockedEndpoint([{ chunks }, aiSDK(aiSDKTextAnswer("It is 7 degrees"))]);
    const execute = vi.fn(async () => ({ temperature: 7 }));
    const chat = new Chat<WeatherChat>({
      request,
      protocol: aiSDKProtocol(),
      tools: { getWeather: { execute } },
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    });

    await chat.sendMessage("Weather?");
    await vi.waitFor(() => expect(calls).toHaveLength(2));
    await vi.waitFor(() => expect(chat.status).toBe("ready"));

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith({ city: "Oslo" }, { toolCallId: "call-1" });
    expect(textOf(chat.messages[1])).toBe("It is 7 degrees");
  });

  it("should finish a plain text stream with its closing events", async () => {
    const { request } = createMockedEndpoint([{ chunks: ["Hel", "lo"] }]);
    const events: ChatStreamEventType[] = [];
    const onFinish = vi.fn();
    const chat = new Chat({
      request,
      protocol: aiSDKTextProtocol(),
      onFinish,
      onEvent: (event) => events.push(event),
    });

    await chat.sendMessage("hi");

    expect(textOf(chat.messages[1])).toBe("Hello");
    expect(events.slice(-3)).toEqual([
      { type: "text-end", id: "text-1" },
      { type: "step-finish" },
      { type: "finish", finishReason: "stop" },
    ]);
    expect(onFinish).toHaveBeenCalledWith(
      expect.objectContaining({ finishReason: "stop", isError: false, isAbort: false }),
    );
  });

  it("should fail the request instead of staying busy when the body can't be built", async () => {
    const { request, calls } = createMockedEndpoint([aiSDK(aiSDKTextAnswer("Recovered"))]);
    const failure = new Error("No session");
    let shouldFail = true;
    const onError = vi.fn();
    const onFinish = vi.fn();
    const chat = new Chat({
      request,
      protocol: aiSDKProtocol(),
      body: () => {
        if (shouldFail) {
          throw failure;
        }
        return {};
      },
      onError,
      onFinish,
    });

    await chat.sendMessage("Hi");

    expect(calls).toHaveLength(0);
    expect(chat.status).toBe("error");
    expect(chat.error).toBe(failure);
    expect(chat.messages).toHaveLength(1);
    expect(onError).toHaveBeenCalledWith(failure);
    expect(onFinish).toHaveBeenCalledWith(
      expect.objectContaining({ isError: true, isAbort: false, message: undefined }),
    );

    shouldFail = false;
    await chat.sendMessage();

    expect(calls).toHaveLength(1);
    expect(chat.status).toBe("ready");
    expect(chat.error).toBeUndefined();
    expect(textOf(chat.messages[1])).toBe("Recovered");
  });

  it("should fail the request when the protocol can't prepare it", async () => {
    const { request, calls } = createMockedEndpoint([aiSDK(aiSDKTextAnswer("unused"))]);
    const chat = new Chat({
      request,
      protocol: aiSDKProtocol({
        prepareBody: () => {
          throw new Error("Bad body");
        },
      }),
    });

    await chat.sendMessage("Hi");

    expect(calls).toHaveLength(0);
    expect(chat.status).toBe("error");
    expect((chat.error as Error).message).toBe("Bad body");

    chat.clearError();
    expect(chat.status).toBe("ready");
  });

  it("should resume a running stream with the resume request", async () => {
    const { request } = createMockedEndpoint([aiSDK([])]);
    const resume = createMockedEndpoint([aiSDK(aiSDKTextAnswer("Resumed"))]);
    const resumeRequest = vi.fn((_chatId: string) => resume.request);
    const chat = new Chat({ id: "chat-9", request, protocol: aiSDKProtocol(), resumeRequest });

    await chat.resumeStream();

    expect(resumeRequest).toHaveBeenCalledWith("chat-9");
    expect(resume.calls[0].payload).toBeUndefined();
    expect(textOf(chat.messages[0])).toBe("Resumed");
  });

  it("should require a resume request to resume", async () => {
    const { request } = createMockedEndpoint([aiSDK([])]);
    const chat = new Chat({ request, protocol: aiSDKProtocol() });
    await expect(chat.resumeStream()).rejects.toThrow("resumeRequest");
  });

  it("should set messages and notify subscribers", () => {
    const { request } = createMockedEndpoint([aiSDK([])]);
    const chat = new Chat({ request, protocol: aiSDKProtocol() });
    const listener = vi.fn();
    const unsubscribe = chat.subscribe(listener);

    chat.setMessages([{ id: "u", role: "user", parts: [] }]);
    chat.setMessages((messages) => [...messages, { id: "a", role: "assistant", parts: [] }]);
    unsubscribe();
    chat.setMessages([]);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(chat.getSnapshot().messages).toEqual([]);
  });
});

function encodeChunks(chunks: { type: string; [key: string]: unknown }[]) {
  return chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`);
}

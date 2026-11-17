import type { ChatMessageType, ChatStreamEventType } from "@hyper-fetch/ai";
import {
  aguiProtocol,
  aguiTextAnswer,
  aiSDKProtocol,
  aiSDKTextAnswer,
  Chat,
  encodeAGUIStream,
  lastAssistantMessageIsCompleteWithToolCalls,
  tanstackAIProtocol,
} from "@hyper-fetch/ai";
import { scopeKey } from "@hyper-fetch/core";

import { aiSDK, createMockedEndpoint, deferred } from "./chat.utils";

type ToolChat = {
  tools: {
    getWeather: { input: { city: string }; output: { temperature: number } };
    confirm: { input: { question: string }; output: { confirmed: boolean } };
  };
};

const textOf = (message: ChatMessageType<any> | undefined) =>
  message?.parts.map((part) => (part.type === "text" ? part.text : "")).join("");

const hasHoles = (messages: unknown[]) => messages.length !== Object.keys(messages).length;

const queueOf = (endpoint: ReturnType<typeof createMockedEndpoint>) =>
  endpoint.client.submitDispatcher.getQueue(scopeKey(endpoint.request.queryKey, endpoint.request.scope)).requests;

/** Resolves on the first event of the given type, so tests can act at an exact point of the stream. */
const onFirst = (type: ChatStreamEventType["type"]) => {
  const seen = deferred();
  return { seen: seen.promise, onEvent: (event: ChatStreamEventType) => event.type === type && seen.resolve() };
};

const toolCallStream = (toolCallId = "c1") =>
  aiSDK([
    { type: "start", messageId: "a-1" },
    { type: "start-step" },
    { type: "tool-input-available", toolCallId, toolName: "getWeather", input: { city: "Oslo" } },
    { type: "finish-step" },
    { type: "finish", finishReason: "tool-calls" },
  ]);

describe("Chat [ Lifecycle ]", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when stopping", () => {
    it("should send a new message right after stop()", async () => {
      const endpoint = createMockedEndpoint(
        [aiSDK(aiSDKTextAnswer("one two three four five")), aiSDK(aiSDKTextAnswer("Second answer"))],
        { chunkTime: 2 },
      );
      const { seen, onEvent } = onFirst("text-delta");
      const onFinish = vi.fn();
      const chat = new Chat({ request: endpoint.request, protocol: aiSDKProtocol(), onEvent, onFinish });

      const first = chat.sendMessage("first");
      await seen;
      chat.stop();
      await chat.sendMessage("second");
      await first;

      expect(endpoint.calls).toHaveLength(2);
      expect(chat.status).toBe("ready");
      expect(chat.messages.map((message) => message.role)).toEqual(["user", "assistant", "user", "assistant"]);
      expect(textOf(chat.messages[1])).toBe("one ");
      expect(textOf(chat.messages[3])).toBe("Second answer");
      expect(onFinish.mock.calls.map(([result]) => result.isAbort)).toEqual([true, false]);
    });

    it("should regenerate right after stop()", async () => {
      const endpoint = createMockedEndpoint(
        [aiSDK(aiSDKTextAnswer("one two three four five")), aiSDK(aiSDKTextAnswer("Better answer"))],
        { chunkTime: 2 },
      );
      const { seen, onEvent } = onFirst("text-delta");
      const chat = new Chat({ request: endpoint.request, protocol: aiSDKProtocol(), onEvent });

      const first = chat.sendMessage("first");
      await seen;
      chat.stop();
      await chat.regenerate();
      await first;

      expect(endpoint.calls).toHaveLength(2);
      expect(endpoint.calls[1].payload.trigger).toBe("regenerate-message");
      expect(chat.messages).toHaveLength(2);
      expect(textOf(chat.messages[1])).toBe("Better answer");
    });

    it("should still ignore a message sent while a request is really in progress", async () => {
      const endpoint = createMockedEndpoint([aiSDK(aiSDKTextAnswer("one two three"))], { chunkTime: 2 });
      const { seen, onEvent } = onFirst("text-delta");
      const chat = new Chat({ request: endpoint.request, protocol: aiSDKProtocol(), onEvent });

      const first = chat.sendMessage("first");
      await seen;
      await chat.sendMessage("ignored");
      await first;

      expect(endpoint.calls).toHaveLength(1);
      expect(chat.messages).toHaveLength(2);
    });

    it("should only start one request when several are sent right after stop()", async () => {
      const endpoint = createMockedEndpoint(
        [aiSDK(aiSDKTextAnswer("one two three four five")), aiSDK(aiSDKTextAnswer("Second answer"))],
        { chunkTime: 2 },
      );
      const { seen, onEvent } = onFirst("text-delta");
      const chat = new Chat({ request: endpoint.request, protocol: aiSDKProtocol(), onEvent });

      const first = chat.sendMessage("first");
      await seen;
      chat.stop();
      await Promise.all([chat.sendMessage("second"), chat.sendMessage("third"), first]);

      expect(endpoint.calls).toHaveLength(2);
      expect(chat.messages.filter((message) => message.role === "user").map(textOf)).toEqual(["first", "second"]);
      expect(chat.status).toBe("ready");
    });

    it("should abort a request stopped before it started", async () => {
      const endpoint = createMockedEndpoint([aiSDK(aiSDKTextAnswer("never shown"))], { chunkTime: 2 });
      const chunk = vi.fn();
      endpoint.client.requestManager.events.onResponseChunk(chunk);
      const onFinish = vi.fn();
      const onEvent = vi.fn();
      const chat = new Chat({ request: endpoint.request, protocol: aiSDKProtocol(), onFinish, onEvent });

      const sent = chat.sendMessage("first");
      chat.stop();
      await sent;

      expect(chat.status).toBe("ready");
      expect(chat.error).toBeUndefined();
      expect(chat.messages).toHaveLength(1);
      expect(onEvent).not.toHaveBeenCalled();
      expect(chunk).not.toHaveBeenCalled();
      expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ isAbort: true, isError: false }));
      expect(queueOf(endpoint)).toHaveLength(0);
    });

    it("should stop a request that is waiting for the network", async () => {
      const endpoint = createMockedEndpoint([aiSDK(aiSDKTextAnswer("never shown"))]);
      endpoint.client.appManager.setOnline(false);
      const onFinish = vi.fn();
      const chat = new Chat({ request: endpoint.request, protocol: aiSDKProtocol(), onFinish });

      const sent = chat.sendMessage("first");
      expect(chat.status).toBe("submitted");
      chat.stop();
      await sent;

      expect(chat.status).toBe("ready");
      expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ isAbort: true, isError: false }));
      // Nothing is left to be sent once the network is back
      expect(queueOf(endpoint)).toHaveLength(0);
      endpoint.client.appManager.setOnline(true);
      expect(endpoint.calls).toHaveLength(0);
    });

    it("should stop a request that is waiting to be retried", async () => {
      vi.useFakeTimers();
      const endpoint = createMockedEndpoint([
        { error: { message: "dropped" }, status: 500 },
        aiSDK(aiSDKTextAnswer("never shown")),
      ]);
      const onFinish = vi.fn();
      const chat = new Chat({
        request: endpoint.request.setRetry(2).setRetryTime(500),
        protocol: aiSDKProtocol(),
        onFinish,
      });

      const sent = chat.sendMessage("first");
      // The first attempt failed, the retry is scheduled half a second later
      await vi.advanceTimersByTimeAsync(200);
      expect(endpoint.calls).toHaveLength(1);
      expect(chat.status).toBe("submitted");
      chat.stop();
      await sent;

      expect(chat.status).toBe("ready");
      expect(chat.error).toBeUndefined();
      expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ isAbort: true, isError: false }));
      expect(queueOf(endpoint)).toHaveLength(0);

      // The retry that was scheduled must not go out anymore
      await vi.advanceTimersByTimeAsync(5000);
      expect(endpoint.calls).toHaveLength(1);
    });

    it("should send again after stopping a request that was waiting to be retried", async () => {
      vi.useFakeTimers();
      const endpoint = createMockedEndpoint([
        { error: { message: "dropped" }, status: 500 },
        aiSDK(aiSDKTextAnswer("Second try")),
      ]);
      const chat = new Chat({ request: endpoint.request.setRetry(2).setRetryTime(500), protocol: aiSDKProtocol() });

      const first = chat.sendMessage("first");
      await vi.advanceTimersByTimeAsync(200);
      chat.stop();
      const second = chat.sendMessage();
      await vi.advanceTimersByTimeAsync(5000);
      await Promise.all([first, second]);

      expect(endpoint.calls).toHaveLength(2);
      expect(chat.status).toBe("ready");
      expect(textOf(chat.messages[1])).toBe("Second try");
    });

    it("should stop a request that went offline while waiting to be retried", async () => {
      vi.useFakeTimers();
      const endpoint = createMockedEndpoint([
        { error: { message: "dropped" }, status: 500 },
        aiSDK(aiSDKTextAnswer("never shown")),
      ]);
      const chat = new Chat({ request: endpoint.request.setRetry(2).setRetryTime(500), protocol: aiSDKProtocol() });

      const sent = chat.sendMessage("first");
      await vi.advanceTimersByTimeAsync(200);
      endpoint.client.appManager.setOnline(false);
      chat.stop();
      await sent;
      endpoint.client.appManager.setOnline(true);
      await vi.advanceTimersByTimeAsync(5000);

      expect(chat.status).toBe("ready");
      expect(endpoint.calls).toHaveLength(1);
    });

    it("should not continue automatically when a client tool finishes after stop()", async () => {
      const endpoint = createMockedEndpoint(
        [
          aiSDK([
            { type: "start", messageId: "a-1" },
            { type: "start-step" },
            { type: "tool-input-available", toolCallId: "c1", toolName: "getWeather", input: { city: "Oslo" } },
            { type: "text-start", id: "t" },
            { type: "text-delta", id: "t", delta: "Checking" },
            { type: "text-delta", id: "t", delta: " the weather" },
            { type: "text-end", id: "t" },
            { type: "finish-step" },
            { type: "finish", finishReason: "tool-calls" },
          ]),
          aiSDK(aiSDKTextAnswer("unwanted")),
        ],
        { chunkTime: 2 },
      );
      const result = deferred<{ temperature: number }>();
      const { seen, onEvent } = onFirst("text-delta");
      const chat = new Chat<ToolChat>({
        request: endpoint.request,
        protocol: aiSDKProtocol(),
        tools: { getWeather: { execute: () => result.promise } },
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
        onEvent,
      });

      const sent = chat.sendMessage("Weather?");
      await seen;
      chat.stop();
      await sent;
      result.resolve({ temperature: 7 });
      await vi.waitFor(() =>
        expect(chat.messages[1].parts.find((part) => part.type === "tool")).toMatchObject({
          state: "output-available",
          output: { temperature: 7 },
        }),
      );

      expect(chat.status).toBe("ready");
      expect(endpoint.calls).toHaveLength(1);

      // The user can still continue on their own
      await chat.sendMessage();
      expect(endpoint.calls).toHaveLength(2);
    });

    it("should continue automatically when the user answers a tool after stop()", async () => {
      const endpoint = createMockedEndpoint([toolCallStream(), aiSDK(aiSDKTextAnswer("It is 7 degrees"))], {
        chunkTime: 2,
      });
      const { seen, onEvent } = onFirst("tool-input-available");
      const chat = new Chat<ToolChat>({
        request: endpoint.request,
        protocol: aiSDKProtocol(),
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
        onEvent,
      });

      const sent = chat.sendMessage("Weather?");
      await seen;
      chat.stop();
      await sent;
      chat.addToolResult({ tool: "getWeather", toolCallId: "c1", output: { temperature: 7 } });
      await vi.waitFor(() => expect(chat.status).toBe("ready"));

      expect(endpoint.calls).toHaveLength(2);
      expect(textOf(chat.messages[1])).toBe("It is 7 degrees");
    });
  });

  describe("when messages are changed while streaming", () => {
    it("should not bring back a chat that was cleared after stop()", async () => {
      const endpoint = createMockedEndpoint([aiSDK(aiSDKTextAnswer("one two three four five"))], { chunkTime: 2 });
      const { seen, onEvent } = onFirst("text-delta");
      const onFinish = vi.fn();
      const chat = new Chat({ request: endpoint.request, protocol: aiSDKProtocol(), onEvent, onFinish });

      const sent = chat.sendMessage("first");
      await seen;
      chat.stop();
      chat.setMessages([]);
      await sent;

      expect(chat.messages).toEqual([]);
      expect(hasHoles(chat.messages)).toBe(false);
      expect(onFinish).toHaveBeenCalledWith(
        expect.objectContaining({ isAbort: true, message: undefined, messages: [] }),
      );
    });

    it("should keep streaming into the right message when earlier messages are removed", async () => {
      const endpoint = createMockedEndpoint(
        [aiSDK(aiSDKTextAnswer("First answer")), aiSDK(aiSDKTextAnswer("one two three four five"))],
        { chunkTime: 2 },
      );
      const chat = new Chat({ request: endpoint.request, protocol: aiSDKProtocol() });
      await chat.sendMessage("first");

      const { seen, onEvent } = onFirst("text-delta");
      chat.setOptions({ onEvent });
      const sent = chat.sendMessage("second");
      await seen;
      // Drop the first exchange while the second answer streams
      chat.setMessages((messages) => messages.slice(2));
      await sent;

      expect(hasHoles(chat.messages)).toBe(false);
      expect(chat.messages).toHaveLength(2);
      expect(chat.messages.map((message) => message.role)).toEqual(["user", "assistant"]);
      expect(textOf(chat.messages[0])).toBe("second");
      expect(textOf(chat.messages[1])).toBe("one two three four five");
      expect(chat.status).toBe("ready");
    });

    it("should keep streaming into the right message when messages are added before it", async () => {
      const endpoint = createMockedEndpoint([aiSDK(aiSDKTextAnswer("one two three four five"))], { chunkTime: 2 });
      const { seen, onEvent } = onFirst("text-delta");
      const chat = new Chat({ request: endpoint.request, protocol: aiSDKProtocol(), onEvent });

      const sent = chat.sendMessage("question");
      await seen;
      chat.setMessages((messages) => [{ id: "system-note", role: "system", parts: [] }, ...messages]);
      await sent;

      expect(hasHoles(chat.messages)).toBe(false);
      expect(chat.messages.map((message) => message.role)).toEqual(["system", "user", "assistant"]);
      expect(textOf(chat.messages[2])).toBe("one two three four five");
    });

    it("should not bring back the streaming message when it is removed", async () => {
      const endpoint = createMockedEndpoint([aiSDK(aiSDKTextAnswer("one two three four five"))], { chunkTime: 2 });
      const { seen, onEvent } = onFirst("text-delta");
      const onFinish = vi.fn();
      const chat = new Chat({ request: endpoint.request, protocol: aiSDKProtocol(), onEvent, onFinish });

      const sent = chat.sendMessage("question");
      await seen;
      chat.setMessages((messages) => messages.filter((message) => message.role !== "assistant"));
      await sent;

      expect(hasHoles(chat.messages)).toBe(false);
      expect(chat.messages.map((message) => message.role)).toEqual(["user"]);
      expect(chat.status).toBe("ready");
      expect(onFinish).toHaveBeenCalledWith(
        expect.objectContaining({ isAbort: false, isError: false, message: undefined }),
      );
    });

    it("should follow the message when the backend renames it and messages are reordered", async () => {
      const endpoint = createMockedEndpoint(
        [
          aiSDK([
            { type: "start-step" },
            { type: "text-start", id: "t" },
            { type: "text-delta", id: "t", delta: "one " },
            { type: "start", messageId: "server-id" },
            { type: "text-delta", id: "t", delta: "two" },
            { type: "text-end", id: "t" },
            { type: "finish", finishReason: "stop" },
          ]),
        ],
        { chunkTime: 2 },
      );
      const { seen, onEvent } = onFirst("text-delta");
      const chat = new Chat({ request: endpoint.request, protocol: aiSDKProtocol(), onEvent });

      const sent = chat.sendMessage("question");
      await seen;
      chat.setMessages((messages) => [{ id: "note", role: "system", parts: [] }, ...messages]);
      await sent;

      expect(chat.messages.map((message) => message.id).slice(-1)).toEqual(["server-id"]);
      expect(chat.messages).toHaveLength(3);
      expect(textOf(chat.messages[2])).toBe("one two");
    });

    it("should drop only the failed attempt when messages changed before a retry", async () => {
      const endpoint = createMockedEndpoint(
        [
          {
            error: { message: "dropped" },
            status: 500,
            chunks: aiSDK(aiSDKTextAnswer("broken answer", { words: false })).chunks.slice(0, 4),
          },
          aiSDK(aiSDKTextAnswer("Fresh answer")),
        ],
        { chunkTime: 2 },
      );
      const { seen, onEvent } = onFirst("text-delta");
      const chat = new Chat({
        request: endpoint.request.setRetry(1).setRetryTime(0),
        protocol: aiSDKProtocol(),
        onEvent,
      });

      const sent = chat.sendMessage("question");
      await seen;
      chat.setMessages((messages) => [{ id: "note", role: "system", parts: [] }, ...messages]);
      await sent;

      expect(hasHoles(chat.messages)).toBe(false);
      expect(chat.messages.map((message) => message.role)).toEqual(["system", "user", "assistant"]);
      expect(textOf(chat.messages[2])).toBe("Fresh answer");
    });
  });

  describe("when a request fails", () => {
    it("should retry with regenerate() when the failed request left no answer", async () => {
      const endpoint = createMockedEndpoint([
        { error: { message: "Bad gateway" }, status: 502 },
        aiSDK(aiSDKTextAnswer("Recovered")),
      ]);
      const chat = new Chat({ request: endpoint.request, protocol: aiSDKProtocol() });

      await chat.sendMessage("Hi");
      expect(chat.status).toBe("error");
      expect(chat.messages).toHaveLength(1);

      await chat.regenerate();

      expect(endpoint.calls).toHaveLength(2);
      expect(endpoint.calls[1].payload.trigger).toBe("regenerate-message");
      expect(endpoint.calls[1].payload.messages).toHaveLength(1);
      expect(chat.status).toBe("ready");
      expect(chat.messages.map((message) => message.role)).toEqual(["user", "assistant"]);
      expect(textOf(chat.messages[1])).toBe("Recovered");
    });

    it("should keep the latest user message when regenerating after a failed follow-up", async () => {
      const endpoint = createMockedEndpoint([
        aiSDK(aiSDKTextAnswer("First answer")),
        { error: { message: "Bad gateway" }, status: 502 },
        aiSDK(aiSDKTextAnswer("Second answer")),
      ]);
      const chat = new Chat({ request: endpoint.request, protocol: aiSDKProtocol() });

      await chat.sendMessage("first");
      await chat.sendMessage("second");
      expect(chat.status).toBe("error");

      await chat.regenerate();

      expect(chat.messages.map((message) => message.role)).toEqual(["user", "assistant", "user", "assistant"]);
      expect(chat.messages.map(textOf)).toEqual(["first", "First answer", "second", "Second answer"]);
      expect(endpoint.calls[2].payload.messages).toHaveLength(3);
    });

    it("should replace a partial answer when regenerating after a stream error", async () => {
      const endpoint = createMockedEndpoint([
        aiSDK([
          { type: "start" },
          { type: "text-start", id: "t" },
          { type: "text-delta", id: "t", delta: "Half an ans" },
          { type: "error", errorText: "Model overloaded" },
        ]),
        aiSDK(aiSDKTextAnswer("Whole answer")),
      ]);
      const chat = new Chat({ request: endpoint.request, protocol: aiSDKProtocol() });

      await chat.sendMessage("Hi");
      expect(chat.status).toBe("error");
      expect(textOf(chat.messages[1])).toBe("Half an ans");

      await chat.regenerate();

      expect(chat.status).toBe("ready");
      expect(chat.messages).toHaveLength(2);
      expect(textOf(chat.messages[1])).toBe("Whole answer");
    });

    it("should do nothing when regenerating an empty chat", async () => {
      const endpoint = createMockedEndpoint([aiSDK(aiSDKTextAnswer("unused"))]);
      const chat = new Chat({ request: endpoint.request, protocol: aiSDKProtocol() });

      await chat.regenerate();

      expect(endpoint.calls).toHaveLength(0);
      expect(chat.status).toBe("ready");
    });

    it("should send interrupt answers again after a request that never reached the backend", async () => {
      const endpoint = createMockedEndpoint([
        { error: { message: "Bad gateway" }, status: 502 },
        { chunks: encodeAGUIStream(aguiTextAnswer("Continued")) },
      ]);
      const chat = new Chat({ request: endpoint.request, protocol: aguiProtocol() });

      chat.resolveInterrupt({ interruptId: "int-1", payload: { ok: true } });
      await chat.sendMessage("Go on");
      expect(chat.status).toBe("error");
      expect(endpoint.calls[0].payload.resume).toEqual([
        { interruptId: "int-1", status: "resolved", payload: { ok: true } },
      ]);

      await chat.sendMessage();

      expect(chat.status).toBe("ready");
      expect(endpoint.calls[1].payload.resume).toEqual([
        { interruptId: "int-1", status: "resolved", payload: { ok: true } },
      ]);
    });

    it("should send tool interrupt answers again after a request that never reached the backend", async () => {
      const endpoint = createMockedEndpoint([
        {
          chunks: encodeAGUIStream([
            { type: "RUN_STARTED", threadId: "t", runId: "r1" },
            { type: "TOOL_CALL_START", toolCallId: "c1", toolCallName: "confirm" },
            { type: "TOOL_CALL_ARGS", toolCallId: "c1", delta: '{"question":"Sure?"}' },
            { type: "TOOL_CALL_END", toolCallId: "c1" },
            {
              type: "RUN_FINISHED",
              threadId: "t",
              runId: "r1",
              outcome: {
                type: "interrupt",
                interrupts: [{ id: "client_tool_c1", reason: "tanstack:client_tool_execution", toolCallId: "c1" }],
              },
            },
          ]),
        },
        { error: { message: "Bad gateway" }, status: 502 },
        { chunks: encodeAGUIStream(aguiTextAnswer("Confirmed")) },
      ]);
      const chat = new Chat<ToolChat>({ request: endpoint.request, protocol: tanstackAIProtocol() });

      await chat.sendMessage("Start");
      chat.addToolResult({ tool: "confirm", toolCallId: "c1", output: { confirmed: true } });
      await chat.sendMessage();
      expect(chat.status).toBe("error");
      await chat.sendMessage();

      const expected = [{ interruptId: "client_tool_c1", status: "resolved", payload: { confirmed: true } }];
      expect(endpoint.calls[1].payload.resume).toEqual(expected);
      expect(endpoint.calls[2].payload.resume).toEqual(expected);
      expect(chat.status).toBe("ready");
    });

    it("should not send interrupt answers twice once the backend answered", async () => {
      const endpoint = createMockedEndpoint([
        { chunks: encodeAGUIStream(aguiTextAnswer("Continued")) },
        { chunks: encodeAGUIStream(aguiTextAnswer("Next")) },
      ]);
      const chat = new Chat({ request: endpoint.request, protocol: aguiProtocol() });

      chat.resolveInterrupt({ interruptId: "int-1" });
      await chat.sendMessage("Go on");
      await chat.sendMessage("More");

      expect(endpoint.calls[0].payload.resume).toHaveLength(1);
      expect(endpoint.calls[1].payload).not.toHaveProperty("resume");
    });
  });
});

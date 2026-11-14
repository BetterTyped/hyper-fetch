import type { AGUIStreamEventType } from "@hyper-fetch/ai";
import {
  aguiProtocol,
  aguiTextAnswer,
  Chat,
  ChatStreamError,
  encodeAGUIStream,
  lastAssistantMessageIsCompleteWithToolCalls,
  tanstackAIProtocol,
} from "@hyper-fetch/ai";

import { createMockedEndpoint } from "./chat.utils";

const agui = (events: AGUIStreamEventType[], framing: "sse" | "ndjson" = "sse") => ({
  chunks: encodeAGUIStream(events, { framing }),
});

type AgentChat = {
  state: { todos: string[]; step: string };
  tools: {
    confirm: { input: { question: string }; output: { confirmed: boolean } };
    deleteFile: { input: { path: string }; output: { deleted: boolean } };
    getTime: { input: Record<string, never>; output: string };
  };
};

describe("Chat [ AG-UI protocol ]", () => {
  it("should stream text, shared state and usage", async () => {
    const { request, calls } = createMockedEndpoint([
      agui([
        { type: "RUN_STARTED", threadId: "thread-1", runId: "r" },
        { type: "STATE_SNAPSHOT", snapshot: { todos: [], step: "plan" } },
        { type: "STATE_DELTA", delta: [{ op: "add", path: "/todos/-", value: "write tests" }] },
        ...aguiTextAnswer("Planning done").slice(1, -1),
        { type: "RUN_FINISHED", threadId: "thread-1", runId: "r", usage: [{ inputTokens: 10, outputTokens: 3 }] },
      ]),
    ]);
    const chat = new Chat<AgentChat>({ id: "thread-1", request, protocol: aguiProtocol() });

    await chat.sendMessage("Plan my day");

    expect(chat.state).toEqual({ todos: ["write tests"], step: "plan" });
    expect(chat.getSnapshot().usage).toEqual({ inputTokens: 10, outputTokens: 3 });
    expect(chat.messages[1].parts).toEqual([
      { type: "step-start" },
      { type: "text", id: "msg-1", text: "Planning done", state: "done" },
    ]);
    expect(calls[0].payload).toMatchObject({
      threadId: "thread-1",
      state: {},
      messages: [{ role: "user", content: "Plan my day" }],
      tools: [],
      context: [],
      forwardedProps: {},
    });
    expect(calls[0].headers).toMatchObject({ Accept: "text/event-stream" });
  });

  it("should send the shared state, the previous run id and client tool definitions", async () => {
    const { request, calls } = createMockedEndpoint([agui(aguiTextAnswer("one")), agui(aguiTextAnswer("two"))]);
    const chat = new Chat<AgentChat>({
      request,
      protocol: aguiProtocol(),
      state: { todos: ["a"], step: "x" },
      tools: {
        confirm: {
          description: "Ask the user",
          parameters: { type: "object", properties: { question: { type: "string" } } },
          execute: async () => ({ confirmed: true }),
        },
        getTime: {
          inputSchema: {
            "~standard": {
              version: 1,
              vendor: "test",
              validate: (value: unknown) => ({ value: value as Record<string, never> }),
              jsonSchema: { input: () => ({ type: "object", properties: {} }) },
            },
          } as never,
        },
      },
    });

    await chat.sendMessage("one");
    chat.setState((state) => ({ ...(state as AgentChat["state"]), step: "y" }));
    await chat.sendMessage("two");

    expect(calls[1].payload.parentRunId).toBe(calls[0].payload.runId);
    expect(calls[1].payload.state).toEqual({ todos: ["a"], step: "y" });
    expect(calls[1].payload.tools).toEqual([
      {
        name: "confirm",
        description: "Ask the user",
        parameters: { type: "object", properties: { question: { type: "string" } } },
      },
      { name: "getTime", parameters: { type: "object", properties: {} } },
    ]);
  });

  it("should run client tools and send their results as tool messages", async () => {
    const { request, calls } = createMockedEndpoint([
      agui([
        { type: "RUN_STARTED", threadId: "t", runId: "r1" },
        { type: "TOOL_CALL_START", toolCallId: "c1", toolCallName: "confirm" },
        { type: "TOOL_CALL_ARGS", toolCallId: "c1", delta: '{"question":"Sure?"}' },
        { type: "TOOL_CALL_END", toolCallId: "c1" },
        { type: "RUN_FINISHED", threadId: "t", runId: "r1", outcome: { type: "success", pendingToolCallIds: ["c1"] } },
      ]),
      agui(aguiTextAnswer("Confirmed, continuing")),
    ]);
    const chat = new Chat<AgentChat>({
      request,
      protocol: aguiProtocol(),
      tools: { confirm: { execute: async () => ({ confirmed: true }) } },
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    });

    await chat.sendMessage("Delete everything");
    await vi.waitFor(() => expect(calls).toHaveLength(2));
    await vi.waitFor(() => expect(chat.status).toBe("ready"));

    expect(calls[1].payload.messages.slice(1)).toEqual([
      {
        id: chat.messages[1].id,
        role: "assistant",
        toolCalls: [{ id: "c1", type: "function", function: { name: "confirm", arguments: '{"question":"Sure?"}' } }],
      },
      { id: "c1-result", role: "tool", toolCallId: "c1", content: '{"confirmed":true}' },
    ]);
    expect(chat.messages[1].parts.at(-1)).toMatchObject({ type: "text", text: "Confirmed, continuing" });
  });

  it("should replace messages from a MESSAGES_SNAPSHOT and keep streaming into the matching message", async () => {
    const { request } = createMockedEndpoint([
      agui([
        { type: "RUN_STARTED", threadId: "t", runId: "r" },
        {
          type: "MESSAGES_SNAPSHOT",
          messages: [
            { id: "old-user", role: "user", content: "earlier question" },
            { id: "old-answer", role: "assistant", content: "earlier answer" },
          ],
        },
        { type: "TEXT_MESSAGE_START", messageId: "new", role: "assistant" },
        { type: "TEXT_MESSAGE_CONTENT", messageId: "new", delta: "fresh" },
        { type: "TEXT_MESSAGE_END", messageId: "new" },
        { type: "RUN_FINISHED", threadId: "t", runId: "r" },
      ]),
    ]);
    const chat = new Chat({ request, protocol: aguiProtocol() });

    await chat.sendMessage("now");

    expect(chat.messages.map((message) => message.id).slice(0, 2)).toEqual(["old-user", "old-answer"]);
    expect(chat.messages).toHaveLength(3);
    // The snapshot replaced the history, so streaming continues into a fresh assistant message
    expect(chat.messages[2].parts).toEqual([{ type: "text", id: "new", text: "fresh", state: "done" }]);
  });

  it("should expose generic interrupts and send their answers with the next run", async () => {
    const { request, calls } = createMockedEndpoint([
      agui([
        { type: "RUN_STARTED", threadId: "t", runId: "r1" },
        {
          type: "RUN_FINISHED",
          threadId: "t",
          runId: "r1",
          outcome: {
            type: "interrupt",
            interrupts: [{ id: "int-1", reason: "confirm_plan", message: "Approve the plan?" }],
          },
        },
      ]),
      agui(aguiTextAnswer("Plan approved")),
    ]);
    const chat = new Chat({ request, protocol: aguiProtocol() });

    await chat.sendMessage("Make a plan");
    expect(chat.getSnapshot().interrupts).toEqual([
      { id: "int-1", reason: "confirm_plan", message: "Approve the plan?" },
    ]);

    chat.resolveInterrupt({ interruptId: "int-1", payload: { approved: true } });
    expect(chat.getSnapshot().interrupts).toEqual([]);
    await chat.sendMessage();

    expect(calls[1].payload.resume).toEqual([
      { interruptId: "int-1", status: "resolved", payload: { approved: true } },
    ]);
  });

  it("should expose RUN_ERROR as a stream error", async () => {
    const { request } = createMockedEndpoint([
      agui([
        { type: "RUN_STARTED", threadId: "t", runId: "r" },
        { type: "RUN_ERROR", message: "Agent crashed" },
      ]),
    ]);
    const chat = new Chat({ request, protocol: aguiProtocol() });

    await chat.sendMessage("go");

    expect(chat.error).toBeInstanceOf(ChatStreamError);
    expect((chat.error as Error).message).toBe("Agent crashed");
  });

  it("should fail on an invalid state delta", async () => {
    const { request } = createMockedEndpoint([
      agui([
        { type: "STATE_DELTA", delta: [{ op: "replace", path: "/missing/deep", value: 1 }] },
        { type: "RUN_FINISHED" },
      ]),
    ]);
    const chat = new Chat({ request, protocol: aguiProtocol() });

    await chat.sendMessage("go");

    expect(chat.status).toBe("error");
    expect((chat.error as Error).name).toBe("JSONPatchError");
  });
});

describe("Chat [ TanStack AI protocol ]", () => {
  it("should send the run id header and decode NDJSON responses", async () => {
    const { request, calls } = createMockedEndpoint([agui(aguiTextAnswer("Hello from TanStack"), "ndjson")]);
    const chat = new Chat({ request, protocol: tanstackAIProtocol() });

    await chat.sendMessage("Hi");

    expect(calls[0].headers).toMatchObject({ "X-Run-Id": calls[0].payload.runId });
    expect(chat.messages[1].parts).toMatchObject([
      { type: "step-start" },
      { type: "text", text: "Hello from TanStack" },
    ]);
  });

  it("should answer approval interrupts with resume entries", async () => {
    const { request, calls } = createMockedEndpoint([
      agui([
        { type: "RUN_STARTED", threadId: "t", runId: "r1" },
        { type: "TOOL_CALL_START", toolCallId: "c1", toolCallName: "deleteFile" },
        { type: "TOOL_CALL_ARGS", toolCallId: "c1", delta: '{"path":"/tmp/a"}' },
        { type: "TOOL_CALL_END", toolCallId: "c1" },
        {
          type: "RUN_FINISHED",
          threadId: "t",
          runId: "r1",
          outcome: {
            type: "interrupt",
            interrupts: [
              {
                id: "approval-1",
                reason: "tool_call",
                message: "Delete /tmp/a?",
                toolCallId: "c1",
                metadata: { kind: "approval", toolName: "deleteFile" },
              },
            ],
          },
        },
      ]),
      agui([
        { type: "RUN_STARTED", threadId: "t", runId: "r2" },
        { type: "TOOL_CALL_RESULT", messageId: "m", toolCallId: "c1", content: '{"deleted":true}' },
        { type: "RUN_FINISHED", threadId: "t", runId: "r2" },
      ]),
    ]);
    const chat = new Chat<AgentChat>({ request, protocol: tanstackAIProtocol() });

    await chat.sendMessage("Clean up");
    expect(chat.messages[1].parts[1]).toMatchObject({
      state: "approval-requested",
      approval: { id: "approval-1", reason: "Delete /tmp/a?" },
      interruptId: "approval-1",
    });

    chat.addToolApprovalResponse({ id: "approval-1", approved: true });
    await chat.sendMessage();

    expect(calls[1].payload.resume).toEqual([{ interruptId: "approval-1", status: "resolved", payload: true }]);
    expect(chat.messages[1].parts[1]).toMatchObject({ state: "output-available", output: { deleted: true } });

    // Answered interrupts are sent only once
    await chat.sendMessage("thanks");
    expect(calls[2].payload.resume).toBeUndefined();
  });

  it("should send denied approvals with their reason", async () => {
    const { request, calls } = createMockedEndpoint([
      agui([
        { type: "TOOL_CALL_START", toolCallId: "c1", toolCallName: "deleteFile" },
        { type: "TOOL_CALL_END", toolCallId: "c1" },
        {
          type: "RUN_FINISHED",
          outcome: {
            type: "interrupt",
            interrupts: [{ id: "ap", reason: "tool_call", toolCallId: "c1", metadata: { kind: "approval" } }],
          },
        },
      ]),
      agui(aguiTextAnswer("Ok, not deleting")),
    ]);
    const chat = new Chat<AgentChat>({ request, protocol: tanstackAIProtocol() });

    await chat.sendMessage("Clean up");
    chat.addToolApprovalResponse({ id: "ap", approved: false, reason: "Too risky" });
    await chat.sendMessage();

    expect(calls[1].payload.resume).toEqual([
      { interruptId: "ap", status: "resolved", payload: { approved: false, reason: "Too risky" } },
    ]);
  });

  it("should resume client tool interrupts that arrive after the tool already ran", async () => {
    const { request, calls } = createMockedEndpoint([
      agui([
        { type: "RUN_STARTED", threadId: "t", runId: "r1" },
        { type: "TOOL_CALL_START", toolCallId: "c1", toolCallName: "confirm" },
        { type: "TOOL_CALL_ARGS", toolCallId: "c1", delta: '{"question":"Proceed?"}' },
        { type: "TOOL_CALL_END", toolCallId: "c1" },
        {
          type: "RUN_FINISHED",
          threadId: "t",
          runId: "r1",
          outcome: {
            type: "interrupt",
            interrupts: [
              {
                id: "client_tool_c1",
                reason: "tanstack:client_tool_execution",
                toolCallId: "c1",
                metadata: { kind: "client_tool", toolName: "confirm" },
              },
            ],
          },
        },
      ]),
      agui(aguiTextAnswer("Proceeding")),
    ]);
    const chat = new Chat<AgentChat>({
      request,
      protocol: tanstackAIProtocol(),
      tools: { confirm: { execute: async ({ question }) => ({ confirmed: question.endsWith("?") }) } },
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    });

    await chat.sendMessage("Start");
    await vi.waitFor(() => expect(calls).toHaveLength(2));
    await vi.waitFor(() => expect(chat.status).toBe("ready"));

    expect(calls[1].payload.resume).toEqual([
      { interruptId: "client_tool_c1", status: "resolved", payload: { confirmed: true } },
    ]);
    expect(chat.messages[1].parts[1]).toMatchObject({ state: "output-available", interruptId: "client_tool_c1" });
  });

  it("should resume client tool errors with the TanStack error state", async () => {
    const { request, calls } = createMockedEndpoint([
      agui([
        { type: "TOOL_CALL_START", toolCallId: "c1", toolCallName: "confirm" },
        { type: "TOOL_CALL_END", toolCallId: "c1" },
        {
          type: "RUN_FINISHED",
          outcome: {
            type: "interrupt",
            interrupts: [{ id: "client_tool_c1", reason: "tanstack:client_tool_execution", toolCallId: "c1" }],
          },
        },
      ]),
      agui(aguiTextAnswer("Sorry")),
    ]);
    const chat = new Chat<AgentChat>({ request, protocol: tanstackAIProtocol() });

    await chat.sendMessage("Start");
    chat.addToolResult({
      tool: "confirm",
      toolCallId: "c1",
      state: "output-error",
      errorText: "User closed the dialog",
    });
    await chat.sendMessage();

    expect(calls[1].payload.resume).toEqual([
      {
        interruptId: "client_tool_c1",
        status: "resolved",
        payload: { error: "User closed the dialog" },
        metadata: { tanstack: { state: "output-error" } },
      },
    ]);
  });
});

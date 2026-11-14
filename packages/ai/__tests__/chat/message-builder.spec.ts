import type { ChatMessageType, ChatStreamEventType } from "@hyper-fetch/ai";
import { ChatMessageBuilder, mergeMetadata } from "@hyper-fetch/ai";

const build = (events: ChatStreamEventType[], initial?: ChatMessageType) => {
  const builder = new ChatMessageBuilder(initial ?? { id: "m1", role: "assistant", parts: [] });
  events.forEach((event) => builder.apply(event));
  return builder;
};

describe("ChatMessageBuilder", () => {
  it("should build streaming text and reasoning parts", () => {
    const { message } = build([
      { type: "reasoning-start", id: "r" },
      { type: "reasoning-delta", id: "r", delta: "think" },
      { type: "reasoning-end", id: "r" },
      { type: "text-start", id: "t" },
      { type: "text-delta", id: "t", delta: "Hel" },
      { type: "text-delta", id: "t", delta: "lo" },
    ]);
    expect(message.parts).toEqual([
      { type: "reasoning", id: "r", text: "think", state: "done" },
      { type: "text", id: "t", text: "Hello", state: "streaming" },
    ]);
  });

  it("should create a text part for a delta without a start", () => {
    const { message } = build([{ type: "text-delta", id: "t", delta: "x" }]);
    expect(message.parts).toEqual([{ type: "text", id: "t", text: "x", state: "streaming" }]);
  });

  it("should produce new message and parts objects while keeping untouched parts", () => {
    const builder = build([
      { type: "text-start", id: "a" },
      { type: "text-delta", id: "a", delta: "first" },
      { type: "text-end", id: "a" },
      { type: "text-start", id: "b" },
    ]);
    const before = builder.message;
    builder.apply({ type: "text-delta", id: "b", delta: "x" });
    expect(builder.message).not.toBe(before);
    expect(builder.message.parts).not.toBe(before.parts);
    expect(builder.message.parts[0]).toBe(before.parts[0]);
  });

  it("should stream tool input as partial JSON and finish with the full input", () => {
    const builder = build([
      { type: "tool-input-start", toolCallId: "c1", toolName: "search" },
      { type: "tool-input-delta", toolCallId: "c1", delta: '{"query":"ca' },
    ]);
    expect(builder.message.parts[0]).toMatchObject({
      type: "tool",
      toolName: "search",
      state: "input-streaming",
      input: { query: "ca" },
      rawInput: '{"query":"ca',
    });

    builder.apply({ type: "tool-input-available", toolCallId: "c1", toolName: "search", input: { query: "cats" } });
    expect(builder.message.parts[0]).toEqual({
      type: "tool",
      toolName: "search",
      toolCallId: "c1",
      state: "input-available",
      input: { query: "cats" },
    });

    builder.apply({ type: "tool-output-available", toolCallId: "c1", output: { hits: 3 }, preliminary: true });
    expect(builder.message.parts[0]).toMatchObject({
      state: "output-available",
      output: { hits: 3 },
      preliminary: true,
    });
    builder.apply({ type: "tool-output-available", toolCallId: "c1", output: { hits: 4 } });
    expect(builder.message.parts[0]).not.toHaveProperty("preliminary");
    expect(builder.message.parts[0]).toMatchObject({ output: { hits: 4 } });
  });

  it("should handle tool calls that arrive without a start event", () => {
    const { message } = build([
      {
        type: "tool-input-available",
        toolCallId: "c1",
        toolName: "x",
        input: {},
        providerExecuted: true,
        dynamic: true,
      },
    ]);
    expect(message.parts[0]).toMatchObject({ state: "input-available", providerExecuted: true, dynamic: true });
  });

  it("should track tool errors and denials", () => {
    const { message } = build([
      { type: "tool-input-error", toolCallId: "c1", toolName: "x", input: "bad", errorText: "Invalid input" },
      { type: "tool-input-available", toolCallId: "c2", toolName: "y", input: {} },
      { type: "tool-output-error", toolCallId: "c2", errorText: "boom" },
      { type: "tool-input-available", toolCallId: "c3", toolName: "z", input: {} },
      { type: "tool-output-denied", toolCallId: "c3" },
    ]);
    expect(message.parts).toMatchObject([
      { toolCallId: "c1", state: "output-error", errorText: "Invalid input", input: "bad" },
      { toolCallId: "c2", state: "output-error", errorText: "boom" },
      { toolCallId: "c3", state: "output-denied", approval: { approved: false } },
    ]);
  });

  it("should go through the approval flow", () => {
    const builder = build([
      { type: "tool-input-available", toolCallId: "c1", toolName: "pay", input: { amount: 5 } },
      { type: "tool-approval-request", toolCallId: "c1", approvalId: "a1", reason: "Costs money", interruptId: "i1" },
    ]);
    expect(builder.message.parts[0]).toMatchObject({
      state: "approval-requested",
      approval: { id: "a1", reason: "Costs money" },
      interruptId: "i1",
    });
    expect(builder.apply({ type: "tool-approval-response", approvalId: "unknown", approved: true })).toBe(false);
    builder.apply({ type: "tool-approval-response", approvalId: "a1", approved: true, reason: "fine" });
    expect(builder.message.parts[0]).toMatchObject({
      state: "approval-responded",
      approval: { id: "a1", approved: true, reason: "Costs money", responseReason: "fine" },
    });
  });

  it("should store data parts and reconcile them by name and id", () => {
    const { message } = build([
      { type: "data", name: "weather", id: "w", data: { status: "loading" } },
      { type: "data", name: "weather", id: "w", data: { status: "done", temp: 20 } },
      { type: "data", name: "weather", data: { anonymous: true } },
      { type: "data", name: "notification", data: "skip me", transient: true },
      { type: "data-patch", name: "weather", id: "w", patch: [{ op: "replace", path: "/temp", value: 21 }] },
    ]);
    expect(message.parts).toEqual([
      { type: "data", name: "weather", id: "w", data: { status: "done", temp: 21 } },
      { type: "data", name: "weather", data: { anonymous: true } },
    ]);
  });

  it("should add steps, sources and files and drop parts on step reset", () => {
    const { message } = build([
      { type: "step-start" },
      { type: "text-delta", id: "a", delta: "kept" },
      { type: "source", sourceType: "url", sourceId: "s1", url: "https://a.com", title: "A" },
      { type: "file", url: "data:image/png;base64,AA", mediaType: "image/png" },
      { type: "step-start" },
      { type: "text-delta", id: "b", delta: "dropped" },
      { type: "step-reset" },
    ]);
    expect(message.parts).toEqual([
      { type: "step-start" },
      { type: "text", id: "a", text: "kept", state: "streaming" },
      { type: "source", sourceType: "url", sourceId: "s1", url: "https://a.com", title: "A" },
      { type: "file", url: "data:image/png;base64,AA", mediaType: "image/png" },
    ]);
  });

  it("should set the id and merge metadata", () => {
    const { message } = build([
      { type: "message-start", messageId: "server-id", metadata: { a: 1 } },
      { type: "message-metadata", metadata: { b: 2 } },
      { type: "finish", finishReason: "stop", metadata: { a: 3 } },
    ]);
    expect(message.id).toBe("server-id");
    expect(message.metadata).toEqual({ a: 3, b: 2 });
    expect(mergeMetadata("x", { a: 1 })).toEqual({ a: 1 });
    expect(mergeMetadata({ a: 1 }, undefined)).toEqual({ a: 1 });
  });

  it("should continue an existing message", () => {
    const initial: ChatMessageType = {
      id: "existing",
      role: "assistant",
      parts: [{ type: "text", id: "t", text: "before", state: "done" }],
    };
    const { message } = build([{ type: "step-start" }, { type: "text-delta", id: "t2", delta: "after" }], initial);
    expect(message.parts).toHaveLength(3);
    expect(message.id).toBe("existing");
  });

  it("should ignore events that do not change the message", () => {
    const builder = build([]);
    expect(builder.apply({ type: "usage", usage: { inputTokens: 1 } })).toBe(false);
    expect(builder.apply({ type: "message-start" })).toBe(false);
    expect(builder.apply({ type: "text-end", id: "missing" })).toBe(false);
    expect(builder.apply({ type: "tool-input-delta", toolCallId: "missing", delta: "{" })).toBe(false);
    expect(builder.apply({ type: "tool-output-available", toolCallId: "missing", output: 1 })).toBe(false);
    expect(builder.apply({ type: "data-patch", name: "x", id: "missing", patch: [] })).toBe(false);
    expect(builder.apply({ type: "tool-client-execution", toolCallId: "missing" })).toBe(false);
  });

  it("should finalize streaming parts", () => {
    const builder = build([
      { type: "text-delta", id: "t", delta: "x" },
      { type: "reasoning-delta", id: "r", delta: "y" },
    ]);
    expect(builder.finalize()).toBe(true);
    expect(builder.message.parts.every((part) => "state" in part && part.state === "done")).toBe(true);
    expect(builder.finalize()).toBe(false);
  });
});

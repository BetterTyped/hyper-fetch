import type { ChatMessageType, ChatPartType, ChatStreamEventType } from "@hyper-fetch/ai";
import { ChatMessageBuilder, encodeAISDKStream, mapAISDKChunk, mergeMetadata } from "@hyper-fetch/ai";

import { aiSDKScenarioNames, aiSDKScenarios } from "../differential/ai-sdk.scenarios";

const empty = (): ChatMessageType => ({ id: "m1", role: "assistant", parts: [] });

const eventsOf = (name: string): ChatStreamEventType[] =>
  aiSDKScenarios[name].flatMap((chunk) => mapAISDKChunk(chunk as { type: string }));

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
};

describe("ChatMessageBuilder [ invariants ]", () => {
  describe.each(aiSDKScenarioNames)("when building: %s", (name) => {
    const events = eventsOf(name);

    it("should return a new message and parts array exactly when something changed", () => {
      const builder = new ChatMessageBuilder(empty());
      events.forEach((event) => {
        const before = builder.message;
        const snapshot = JSON.stringify(before);

        const changed = builder.apply(event);

        if (changed) {
          expect(builder.message, JSON.stringify(event)).not.toBe(before);
        } else {
          expect(builder.message, JSON.stringify(event)).toBe(before);
          expect(builder.message.parts).toBe(before.parts);
        }
        // Whatever was handed out before is never mutated
        expect(JSON.stringify(before)).toBe(snapshot);
      });
    });

    it("should keep the identity of every part an event did not touch", () => {
      const builder = new ChatMessageBuilder(empty());
      events.forEach((event) => {
        const before = builder.message.parts;
        builder.apply(event);
        const after = builder.message.parts;
        if (event.type === "step-reset") {
          // Parts are only dropped from the end
          expect(after).toEqual(before.slice(0, after.length));
          after.forEach((part, index) => expect(part).toBe(before[index]));
          return;
        }
        const replaced = after.filter((part, index) => index < before.length && part !== before[index]);
        expect(replaced.length, JSON.stringify(event)).toBeLessThanOrEqual(1);
        expect(after.length - before.length, JSON.stringify(event)).toBeGreaterThanOrEqual(0);
        expect(after.length - before.length, JSON.stringify(event)).toBeLessThanOrEqual(1);
      });
    });

    it("should work on frozen messages and never mutate its input", () => {
      const initial = deepFreeze(empty());
      const builder = new ChatMessageBuilder(initial);

      expect(() => {
        events.forEach((event) => {
          builder.apply(deepFreeze(structuredClone(event)));
          deepFreeze(builder.message);
        });
        builder.finalize();
      }).not.toThrow();
      expect(initial).toEqual(empty());
    });

    it("should build the same message from the same events every time", () => {
      const build = () => {
        const builder = new ChatMessageBuilder(empty());
        events.forEach((event) => builder.apply(event));
        return builder.message;
      };
      expect(build()).toEqual(build());
    });

    it("should keep the role and only take a new id from the stream", () => {
      const builder = new ChatMessageBuilder(empty());
      events.forEach((event) => builder.apply(event));
      const start = events.find((event) => event.type === "message-start");
      const messageId = start?.type === "message-start" ? start.messageId : undefined;

      expect(builder.message.role).toBe("assistant");
      expect(builder.message.id).toBe(messageId ?? "m1");
    });

    it("should leave no part streaming after finalize and report whether it changed anything", () => {
      const builder = new ChatMessageBuilder(empty());
      events.forEach((event) => builder.apply(event));
      const before = builder.message;
      const open = before.parts.filter((part) => "state" in part && part.state === "streaming");

      expect(builder.finalize()).toBe(open.length > 0);

      builder.message.parts.forEach((part) => {
        if (part.type === "text" || part.type === "reasoning") {
          expect(part.state).toBe("done");
        }
      });
      if (open.length === 0) {
        expect(builder.message).toBe(before);
      }
      // Finalizing twice changes nothing
      const finalized = builder.message;
      expect(builder.finalize()).toBe(false);
      expect(builder.message).toBe(finalized);
    });

    it("should continue an existing message without touching its parts", () => {
      const previous: ChatMessageType = deepFreeze({
        id: "old",
        role: "assistant",
        metadata: { kept: true },
        parts: [
          { type: "step-start" },
          { type: "text", id: "0", text: "Earlier answer.", state: "done" },
          { type: "reasoning", id: "0", text: "Earlier thought.", state: "done" },
          { type: "tool", toolName: "old", toolCallId: "old-call", state: "output-available", input: {}, output: 1 },
        ],
      } satisfies ChatMessageType);
      const builder = new ChatMessageBuilder(previous);

      events.forEach((event) => builder.apply(event));

      builder.message.parts.slice(0, previous.parts.length).forEach((part, index) => {
        expect(part).toBe(previous.parts[index]);
      });
      const fresh = new ChatMessageBuilder(empty());
      events.forEach((event) => fresh.apply(event));
      expect(builder.message.parts.slice(previous.parts.length)).toEqual(fresh.message.parts);
    });
  });

  describe("when events are applied one by one", () => {
    it("should keep part ids stable while a part is streaming", () => {
      const builder = new ChatMessageBuilder(empty());
      builder.apply({ type: "text-start", id: "t" });
      builder.apply({ type: "tool-input-start", toolCallId: "c", toolName: "x" });
      const ids = () =>
        builder.message.parts.map((part) => ("id" in part ? part.id : (part as { toolCallId: string }).toolCallId));
      const first = ids();

      builder.apply({ type: "text-delta", id: "t", delta: "a" });
      builder.apply({ type: "tool-input-delta", toolCallId: "c", delta: "{}" });
      builder.apply({ type: "text-end", id: "t" });
      builder.apply({ type: "tool-input-available", toolCallId: "c", toolName: "x", input: {} });
      builder.apply({ type: "tool-output-available", toolCallId: "c", output: 1 });

      expect(ids()).toEqual(first);
    });

    it("should report no change for events that leave the message as it is", () => {
      const builder = new ChatMessageBuilder(empty());
      builder.apply({ type: "text-start", id: "t" });
      builder.apply({ type: "text-end", id: "t" });
      const before = builder.message;

      const unchanged: ChatStreamEventType[] = [
        { type: "message-start" },
        { type: "message-metadata", metadata: undefined },
        { type: "message-metadata", metadata: null },
        { type: "finish" },
        { type: "finish", finishReason: "stop", metadata: null },
        { type: "step-finish" },
        { type: "text-end", id: "t" },
        { type: "text-end", id: "unknown" },
        { type: "reasoning-end", id: "t" },
        { type: "tool-input-delta", toolCallId: "unknown", delta: "{" },
        { type: "tool-output-available", toolCallId: "unknown", output: 1 },
        { type: "tool-output-error", toolCallId: "unknown", errorText: "x" },
        { type: "tool-output-denied", toolCallId: "unknown" },
        { type: "tool-approval-request", toolCallId: "unknown", approvalId: "a" },
        { type: "tool-approval-response", approvalId: "unknown", approved: true },
        { type: "tool-client-execution", toolCallId: "unknown", interruptId: "i" },
        { type: "tool-client-execution", toolCallId: "unknown" },
        { type: "data", name: "x", data: 1, transient: true },
        { type: "data-patch", name: "x", id: "unknown", patch: [] },
        { type: "run-start", threadId: "t", runId: "r" },
        { type: "state-snapshot", state: {} },
        { type: "state-delta", patch: [] },
        { type: "messages-snapshot", messages: [] },
        { type: "interrupt", interrupts: [] },
        { type: "usage", usage: {} },
        { type: "error", errorText: "x" },
        { type: "abort" },
        { type: "raw", protocol: "x", value: 1 },
      ];
      unchanged.forEach((event) => {
        expect(builder.apply(event), JSON.stringify(event)).toBe(false);
        expect(builder.message, JSON.stringify(event)).toBe(before);
      });
    });

    it("should only drop what the current step produced on a step reset", () => {
      const builder = new ChatMessageBuilder({
        id: "old",
        role: "assistant",
        parts: [{ type: "text", id: "t", text: "From the last request", state: "done" }],
      });
      // A reset before any step started in this stream keeps what the message already had
      builder.apply({ type: "text-delta", id: "x", delta: "new" });
      expect(builder.apply({ type: "step-reset" })).toBe(true);
      expect(builder.message.parts).toEqual([{ type: "text", id: "t", text: "From the last request", state: "done" }]);

      builder.apply({ type: "step-start" });
      builder.apply({ type: "tool-input-start", toolCallId: "c", toolName: "x" });
      builder.apply({ type: "tool-input-delta", toolCallId: "c", delta: '{"old":' });
      builder.apply({ type: "step-reset" });
      builder.apply({ type: "tool-input-start", toolCallId: "c", toolName: "x" });
      builder.apply({ type: "tool-input-delta", toolCallId: "c", delta: '{"new":1}' });

      expect(builder.message.parts).toEqual([
        { type: "text", id: "t", text: "From the last request", state: "done" },
        { type: "step-start" },
        // The half-streamed input of the dropped attempt is gone
        {
          type: "tool",
          toolName: "x",
          toolCallId: "c",
          state: "input-streaming",
          input: { new: 1 },
          rawInput: '{"new":1}',
        },
      ]);
    });

    it("should replace a preliminary output by an error", () => {
      const builder = new ChatMessageBuilder(empty());
      builder.apply({ type: "tool-input-available", toolCallId: "c", toolName: "x", input: { a: 1 } });
      builder.apply({ type: "tool-output-available", toolCallId: "c", output: { progress: 1 }, preliminary: true });
      builder.apply({ type: "tool-output-error", toolCallId: "c", errorText: "failed" });

      expect(builder.message.parts).toEqual([
        { type: "tool", toolName: "x", toolCallId: "c", state: "output-error", input: { a: 1 }, errorText: "failed" },
      ]);
    });

    it("should drop an earlier result when a tool call gets its input again", () => {
      const builder = new ChatMessageBuilder(empty());
      builder.apply({ type: "tool-input-error", toolCallId: "c", toolName: "x", input: "bad", errorText: "Invalid" });
      builder.apply({ type: "tool-input-available", toolCallId: "c", toolName: "x", input: { fixed: true } });
      expect(builder.message.parts).toEqual([
        { type: "tool", toolName: "x", toolCallId: "c", state: "input-available", input: { fixed: true } },
      ]);

      builder.apply({ type: "tool-output-available", toolCallId: "c", output: 1, preliminary: true });
      builder.apply({ type: "tool-input-error", toolCallId: "c", toolName: "x", input: "bad", errorText: "Invalid" });
      expect(builder.message.parts).toEqual([
        { type: "tool", toolName: "x", toolCallId: "c", state: "output-error", input: "bad", errorText: "Invalid" },
      ]);
    });

    it("should keep provider, dynamic and title flags through the whole tool call", () => {
      const builder = new ChatMessageBuilder(empty());
      builder.apply({
        type: "tool-input-start",
        toolCallId: "c",
        toolName: "x",
        providerExecuted: true,
        dynamic: true,
        title: "Search",
      });
      builder.apply({ type: "tool-input-available", toolCallId: "c", toolName: "x", input: {} });
      builder.apply({ type: "tool-output-available", toolCallId: "c", output: 1 });
      expect(builder.message.parts[0]).toEqual({
        type: "tool",
        toolName: "x",
        toolCallId: "c",
        state: "output-available",
        input: {},
        providerExecuted: true,
        dynamic: true,
        title: "Search",
        output: 1,
      });
    });

    it("should patch data parts and leave other parts with the same id alone", () => {
      const builder = new ChatMessageBuilder(empty());
      builder.apply({ type: "data", name: "a", id: "1", data: { n: 1, list: [1] } });
      builder.apply({ type: "data", name: "b", id: "1", data: { n: 1 } });
      const [, untouched] = builder.message.parts;
      builder.apply({
        type: "data-patch",
        name: "a",
        id: "1",
        patch: [
          { op: "replace", path: "/n", value: 2 },
          { op: "add", path: "/list/-", value: 2 },
        ],
      });
      expect(builder.message.parts[0]).toEqual({ type: "data", name: "a", id: "1", data: { n: 2, list: [1, 2] } });
      expect(builder.message.parts[1]).toBe(untouched);
    });
  });

  describe("when the message is rebased", () => {
    it("should continue streaming on the rebased message", () => {
      const builder = new ChatMessageBuilder(empty());
      builder.apply({ type: "step-start" });
      builder.apply({ type: "text-start", id: "t" });
      builder.apply({ type: "text-delta", id: "t", delta: "Hel" });
      builder.apply({ type: "tool-input-start", toolCallId: "c", toolName: "x" });
      builder.apply({ type: "tool-input-delta", toolCallId: "c", delta: '{"a":' });

      const rebased: ChatMessageType = {
        ...builder.message,
        metadata: { fromSnapshot: true },
        parts: [...builder.message.parts],
      };
      builder.rebase(rebased);
      expect(builder.message).toBe(rebased);

      builder.apply({ type: "text-delta", id: "t", delta: "lo" });
      builder.apply({ type: "tool-input-delta", toolCallId: "c", delta: "1}" });

      expect(builder.message.metadata).toEqual({ fromSnapshot: true });
      expect(builder.message.parts).toEqual([
        { type: "step-start" },
        { type: "text", id: "t", text: "Hello", state: "streaming" },
        {
          type: "tool",
          toolName: "x",
          toolCallId: "c",
          state: "input-streaming",
          input: { a: 1 },
          rawInput: '{"a":1}',
        },
      ]);
      expect(rebased.parts[1]).toEqual({ type: "text", id: "t", text: "Hel", state: "streaming" });
    });

    it("should survive a rebase onto a shorter message", () => {
      const builder = new ChatMessageBuilder(empty());
      builder.apply({ type: "step-start" });
      builder.apply({ type: "text-delta", id: "t", delta: "long" });
      builder.apply({ type: "text-delta", id: "u", delta: "longer" });

      builder.rebase({ id: "m1", role: "assistant", parts: [] });
      expect(builder.apply({ type: "step-reset" })).toBe(false);
      builder.apply({ type: "text-delta", id: "t", delta: "again" });

      expect(builder.message.parts).toEqual([{ type: "text", id: "t", text: "again", state: "streaming" }]);
    });
  });

  describe("when merging metadata", () => {
    const { missing } = {} as { missing?: unknown };
    const merged = (...updates: unknown[]) => {
      let current = missing;
      updates.forEach((next) => {
        current = mergeMetadata(current, next);
      });
      return current;
    };

    it("should merge objects deeply, like AI SDK", () => {
      expect(merged({ a: 1, usage: { input: 1 } }, { b: 2, usage: { output: 2 } })).toEqual({
        a: 1,
        b: 2,
        usage: { input: 1, output: 2 },
      });
      expect(merged({ deep: { a: { b: { c: 1 } } } }, { deep: { a: { b: { d: 2 } } } })).toEqual({
        deep: { a: { b: { c: 1, d: 2 } } },
      });
    });

    it("should replace arrays and primitives instead of merging them", () => {
      expect(merged({ tags: ["a", "b"], n: 1, o: { x: 1 } }, { tags: ["c"], n: 2, o: 5 })).toEqual({
        tags: ["c"],
        n: 2,
        o: 5,
      });
      expect(merged({ o: 5 }, { o: { x: 1 } })).toEqual({ o: { x: 1 } });
      expect(merged({ a: null }, { a: { x: 1 } })).toEqual({ a: { x: 1 } });
      expect(merged({ a: { x: 1 } }, { a: null })).toEqual({ a: null });
    });

    it("should keep the current metadata when the update is missing", () => {
      const current = { a: 1 };
      expect(mergeMetadata(current, missing)).toBe(current);
      expect(mergeMetadata(current, null)).toBe(current);
      expect(mergeMetadata(missing, missing)).toBeUndefined();
      expect(mergeMetadata(current, { a: undefined, b: undefined })).toEqual({ a: 1 });
    });

    it("should replace metadata that is not an object", () => {
      expect(mergeMetadata("text", { a: 1 })).toEqual({ a: 1 });
      expect(mergeMetadata({ a: 1 }, "text")).toBe("text");
      expect(mergeMetadata({ a: 1 }, 0)).toBe(0);
      expect(mergeMetadata({ a: 1 }, false)).toBe(false);
      expect(mergeMetadata([1], [2])).toEqual([2]);
      expect(mergeMetadata({ a: 1 }, [2])).toEqual([2]);
    });

    it("should not mutate what it merges and not pollute prototypes", () => {
      const current = deepFreeze({ a: { b: 1 } });
      const next = deepFreeze(
        JSON.parse('{"a":{"c":2},"__proto__":{"polluted":true},"constructor":{"x":1}}') as object,
      );

      const result = mergeMetadata(current, next) as Record<string, unknown>;

      expect(result).toEqual({ a: { b: 1, c: 2 } });
      expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
      expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
      expect(current).toEqual({ a: { b: 1 } });
    });
  });

  describe("when parts of every kind are streamed through the AI SDK wire format", () => {
    it("should give every part the type its events describe", () => {
      const builder = new ChatMessageBuilder(empty());
      const wire = encodeAISDKStream(Object.values(aiSDKScenarios).flat() as { type: string }[]);
      wire
        .filter((line) => line !== "data: [DONE]\n\n")
        .flatMap((line) => mapAISDKChunk(JSON.parse(line.slice("data: ".length)) as { type: string }))
        .forEach((event) => builder.apply(event));

      const kinds = new Set(builder.message.parts.map((part: ChatPartType) => part.type));
      expect([...kinds].toSorted()).toEqual(["data", "file", "reasoning", "source", "step-start", "text", "tool"]);
    });
  });
});

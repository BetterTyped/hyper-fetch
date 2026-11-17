/**
 * @vitest-environment node
 *
 * The request body side of the AI SDK protocol: what `toAISDKMessages` builds must be accepted by the AI SDK server
 * (`validateUIMessages`, `convertToModelMessages`) for every part type and tool state, and must give the model the
 * same prompt as the AI SDK client's own message would.
 */
import type { ChatMessageType, ChatPartType, ChatToolPartType } from "@hyper-fetch/ai";
import { aiSDKProtocol, fromAISDKMessages, toAISDKMessages } from "@hyper-fetch/ai";
import type { UIMessage } from "ai";
import { convertToModelMessages, safeValidateUIMessages, validateUIMessages } from "ai";

import { comparableParts, oursAsUIMessage, ReferenceChat, runBoth, runOurs, toWire } from "./ai-sdk.reference";
import { aiSDKScenarioNames, aiSDKScenarios } from "./ai-sdk.scenarios";

const user: ChatMessageType = {
  id: "user-1",
  role: "user",
  parts: [{ type: "text", id: "user-1-text", text: "Hi", state: "done" }],
};

const asBody = (messages: ChatMessageType[]) => {
  const { payload } = aiSDKProtocol().prepareRequest({
    chatId: "chat-1",
    runId: "run-1",
    messages,
    trigger: "submit-message",
    body: {},
    state: undefined,
    tools: [],
    resume: [],
  });
  // What actually goes over the wire
  const sent = JSON.stringify(payload);
  return JSON.parse(sent) as { id: string; messages: UIMessage[]; trigger: string };
};

/** The AI SDK leaves `state` off text it did not stream (user input); we always say "done". Both mean the same. */
const comparable = (message: { parts: readonly unknown[] }) =>
  comparableParts(message).map((part) => {
    const { state, ...rest } = part;
    return (part.type === "text" || part.type === "reasoning") && (state === undefined || state === "done")
      ? rest
      : part;
  });

const tool = (state: ChatToolPartType["state"], extra: Record<string, unknown> = {}) =>
  ({
    type: "tool",
    toolName: "search",
    toolCallId: `call-${state}`,
    state,
    input: { q: "x" },
    ...extra,
  }) as ChatPartType;

const toolStates: Record<string, ChatPartType> = {
  "input-streaming": tool("input-streaming", { input: { q: "par" }, rawInput: '{"q":"par' }),
  "input-streaming without input": tool("input-streaming", { input: undefined }),
  "input-available": tool("input-available"),
  "approval-requested": tool("approval-requested", { approval: { id: "ap-1" } }),
  "approval-requested with a reason": tool("approval-requested", { approval: { id: "ap-1", reason: "Costs money" } }),
  "approval-responded (approved)": tool("approval-responded", { approval: { id: "ap-1", approved: true } }),
  "approval-responded (denied with a reason)": tool("approval-responded", {
    approval: { id: "ap-1", reason: "Costs money", approved: false, responseReason: "Too expensive" },
  }),
  "output-available": tool("output-available", { output: { hits: 3 } }),
  "output-available with a null output": tool("output-available", { output: null }),
  "output-available (preliminary)": tool("output-available", { output: { progress: 1 }, preliminary: true }),
  "output-available after approval": tool("output-available", {
    output: { hits: 3 },
    approval: { id: "ap-1", approved: true, responseReason: "ok" },
  }),
  "output-error": tool("output-error", { errorText: "Search is down" }),
  "output-error without input": tool("output-error", {
    input: undefined,
    errorText: "Invalid input",
    rawInput: "{oops",
  }),
  "output-error after approval": tool("output-error", {
    errorText: "Search is down",
    approval: { id: "ap-1", approved: true },
  }),
  "output-denied": tool("output-denied", { approval: { id: "ap-1", approved: false } }),
  "output-denied with a reason": tool("output-denied", {
    approval: { id: "ap-1", approved: false, responseReason: "No" },
  }),
};

const variants: Record<string, Record<string, unknown>> = {
  static: {},
  dynamic: { dynamic: true },
  "provider-executed": { providerExecuted: true },
  titled: { title: "Web search" },
};

describe("AI SDK differential [ request body ]", () => {
  describe.each(Object.keys(variants))("when sending a %s tool part", (variant) => {
    it.each(Object.keys(toolStates))("should be accepted by the AI SDK server in state %s", async (state) => {
      const part = { ...toolStates[state], ...variants[variant] } as ChatPartType;
      const body = asBody([user, { id: "assistant-1", role: "assistant", parts: [{ type: "step-start" }, part] }]);

      const validated = await validateUIMessages({ messages: body.messages });
      await expect(convertToModelMessages(validated)).resolves.toBeInstanceOf(Array);

      const sent = body.messages[1].parts[1] as { type: string; toolName?: string; state: string };
      expect(sent.type).toBe(variant === "dynamic" ? "dynamic-tool" : "tool-search");
      expect(sent.state).toBe((part as ChatToolPartType).state);
      // And it reads back as the part it was
      expect(fromAISDKMessages(body.messages)[1].parts[1]).toEqual(part);
    });
  });

  describe("when sending other parts", () => {
    const parts: Record<string, { role: "user" | "assistant" | "system"; part: ChatPartType }> = {
      text: { role: "assistant", part: { type: "text", id: "t", text: "Hello", state: "done" } },
      "streaming text": { role: "assistant", part: { type: "text", id: "t", text: "Hel", state: "streaming" } },
      "empty text": { role: "assistant", part: { type: "text", id: "t", text: "", state: "done" } },
      reasoning: { role: "assistant", part: { type: "reasoning", id: "r", text: "Hmm", state: "done" } },
      "url source": {
        role: "assistant",
        part: { type: "source", sourceType: "url", sourceId: "s", url: "https://a.com", title: "A" },
      },
      "url source without a title": {
        role: "assistant",
        part: { type: "source", sourceType: "url", sourceId: "s", url: "https://a.com" },
      },
      "document source": {
        role: "assistant",
        part: {
          type: "source",
          sourceType: "document",
          sourceId: "s",
          mediaType: "application/pdf",
          title: "Doc",
          filename: "a.pdf",
        },
      },
      "generated file": {
        role: "assistant",
        part: { type: "file", mediaType: "image/png", url: "data:image/png;base64,iVBORw0KGgo=" },
      },
      "step boundary": { role: "assistant", part: { type: "step-start" } },
      "data part": { role: "assistant", part: { type: "data", name: "weather", id: "w", data: { t: 1 } } },
      "data part without an id": { role: "assistant", part: { type: "data", name: "note", data: "x" } },
      "user text": { role: "user", part: { type: "text", id: "t", text: "Hi", state: "done" } },
      "user file": {
        role: "user",
        part: { type: "file", mediaType: "application/pdf", url: "https://x.com/a.pdf", filename: "a.pdf" },
      },
      "user data URL file": {
        role: "user",
        part: { type: "file", mediaType: "text/plain", url: "data:text/plain;base64,aGk=" },
      },
      "system text": { role: "system", part: { type: "text", id: "t", text: "Be nice", state: "done" } },
    };

    it.each(Object.keys(parts))("should be accepted by the AI SDK server: %s", async (name) => {
      const { role, part } = parts[name];
      const body = asBody([{ id: "m-1", role, metadata: { any: "thing" }, parts: [part] }]);

      const validated = await validateUIMessages({ messages: body.messages });
      await expect(convertToModelMessages(validated)).resolves.toBeInstanceOf(Array);
      expect(body.messages[0].metadata).toEqual({ any: "thing" });
    });

    it("should give the model text, files and tool results in the order they happened", async () => {
      const body = asBody([
        { id: "s", role: "system", parts: [{ type: "text", id: "s0", text: "Be nice", state: "done" }] },
        {
          id: "u",
          role: "user",
          parts: [
            { type: "text", id: "u0", text: "What is this?", state: "done" },
            { type: "file", mediaType: "image/png", url: "https://x.com/cat.png", filename: "cat.png" },
          ],
        },
        {
          id: "a",
          role: "assistant",
          parts: [
            { type: "step-start" },
            { type: "reasoning", id: "r", text: "Look it up", state: "done" },
            { type: "text", id: "t", text: "Checking. ", state: "done" },
            tool("output-available", { output: { animal: "cat" } }),
            tool("output-error", { toolCallId: "call-2", errorText: "down" }),
            { type: "step-start" },
            { type: "text", id: "t2", text: "A cat.", state: "done" },
          ],
        },
      ]);

      const model = await convertToModelMessages(await validateUIMessages({ messages: body.messages }));

      expect(model.map((message) => message.role)).toEqual(["system", "user", "assistant", "tool", "assistant"]);
      expect(model[1].content).toEqual([
        { type: "text", text: "What is this?" },
        {
          type: "file",
          mediaType: "image/png",
          filename: "cat.png",
          data: { type: "url", url: new URL("https://x.com/cat.png") },
        },
      ]);
      expect(model[3].content).toMatchObject([
        {
          type: "tool-result",
          toolCallId: "call-output-available",
          output: { type: "json", value: { animal: "cat" } },
        },
        { type: "tool-result", toolCallId: "call-2", output: { type: "error-text", value: "down" } },
      ]);
      expect(model[4].content).toEqual([{ type: "text", text: "A cat." }]);
    });
  });

  describe.each(aiSDKScenarioNames)("when sending back the message built from: %s", (name) => {
    const chunks = aiSDKScenarios[name];

    it("should be accepted by the AI SDK server after every chunk", async () => {
      const prefixes = chunks.map((_, index) => toWire(chunks.slice(0, index + 1), { done: false }));

      const results = await Promise.all(
        prefixes.map((wire) => safeValidateUIMessages({ messages: asBody([user, runOurs(wire).message]).messages })),
      );

      results.forEach((result, index) => {
        expect(result.success, `after chunk ${index}: ${JSON.stringify(chunks[index])}`).toBe(true);
      });
    });

    it("should give the model the same prompt as the AI SDK client's message", async () => {
      const { reference, ours } = await runBoth(toWire(chunks));
      const body = asBody([user, ours.message]);

      const fromOurs = await convertToModelMessages(await validateUIMessages({ messages: body.messages }));
      const fromReference = await convertToModelMessages(
        await validateUIMessages({ messages: structuredClone(reference.messages) }),
      );

      expect(fromOurs).toEqual(fromReference);
    });

    it("should load the AI SDK client's message and send it back unchanged", async () => {
      const { reference } = await runBoth(toWire(chunks));
      const persisted = structuredClone(reference.messages);

      const loaded = fromAISDKMessages(persisted as Parameters<typeof fromAISDKMessages>[0]);
      const sent = asBody(loaded).messages;

      expect(sent.map((message) => comparable(message))).toEqual(persisted.map((message) => comparable(message)));
      expect(sent.map((message) => message.id)).toEqual(persisted.map((message) => message.id));
      expect(sent.map((message) => message.metadata)).toEqual(persisted.map((message) => message.metadata));
      expect(oursAsUIMessage(loaded.at(-1) as ChatMessageType).role).toBe(persisted.at(-1)?.role);
    });
  });

  describe("when comparing the request with the AI SDK client's request", () => {
    it("should send the same body fields for a new message and a regeneration", async () => {
      const wire = toWire([
        { type: "start", messageId: "srv-1" },
        { type: "text-start", id: "t" },
        { type: "text-end", id: "t" },
      ]);
      const reference = new ReferenceChat({ responses: [wire], id: "chat-1" });
      await reference.sendMessage({ text: "Hi" });
      await reference.regenerate();

      const [submit, regenerate] = reference.requests;
      const ours = asBody([user]);

      expect(Object.keys(ours).toSorted()).toEqual(Object.keys(submit).toSorted());
      expect(ours.id).toBe(submit.id);
      expect(ours.trigger).toBe(submit.trigger);
      expect(ours.messages.map((message) => ({ role: message.role, parts: comparable(message) }))).toEqual(
        submit.messages.map((message) => ({ role: message.role, parts: comparable(message) })),
      );

      const { payload } = aiSDKProtocol().prepareRequest({
        chatId: "chat-1",
        runId: "run-2",
        messages: [user],
        trigger: "regenerate-message",
        messageId: "srv-1",
        body: {},
        state: undefined,
        tools: [],
        resume: [],
      });
      // The AI SDK client only sends `messageId` when `regenerate({ messageId })` names one; `Chat` always names the
      // message it regenerates, which the protocol passes on
      expect(regenerate.messageId).toBeUndefined();
      expect(payload).toMatchObject({ trigger: regenerate.trigger, id: regenerate.id, messageId: "srv-1" });
      expect(toAISDKMessages([user])).toHaveLength(regenerate.messages.length);
    });
  });
});

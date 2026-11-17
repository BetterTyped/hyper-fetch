/**
 * @vitest-environment node
 *
 * Differential tests: the AI SDK's own client (`AbstractChat` + `DefaultChatTransport`, v7) and our decoder + message
 * builder read the same UI message stream bytes. The resulting assistant message must be the same - after every
 * single chunk, not only at the end.
 */
import { comparableParts, oursAsParts, runBoth, runOurs, runReference, toWire } from "./ai-sdk.reference";
import { aiSDKScenarioNames, aiSDKScenarios } from "./ai-sdk.scenarios";

const withoutTrailingStepStart = (parts: { type: string }[]) => {
  const end = parts.findLastIndex((part) => part.type !== "step-start");
  return parts.slice(0, end + 1);
};

describe("AI SDK differential [ UI message stream ]", () => {
  describe.each(aiSDKScenarioNames)("when streaming: %s", (name) => {
    const chunks = aiSDKScenarios[name];

    it("should build the same message as the AI SDK client", async () => {
      const { reference, ours } = await runBoth(toWire(chunks));

      expect(reference.error).toBeUndefined();
      expect(oursAsParts(ours.message)).toEqual(comparableParts(reference.assistant));
      expect(ours.message.metadata).toEqual(reference.assistant?.metadata);
      expect(ours.message.role).toBe("assistant");
    });

    it("should build the same message as the AI SDK client after every chunk", async () => {
      const prefixes = chunks.map((_, index) => chunks.slice(0, index + 1));
      const results = await Promise.all(prefixes.map((prefix) => runBoth(toWire(prefix, { done: false }))));

      results.forEach(({ reference, ours }, index) => {
        const context = `after chunk ${index}: ${JSON.stringify(chunks[index])}`;
        expect(reference.error, context).toBeUndefined();
        // The AI SDK client only publishes a step boundary together with the first part of the step
        expect(withoutTrailingStepStart(oursAsParts(ours.message)), context).toEqual(
          withoutTrailingStepStart(comparableParts(reference.assistant)),
        );
        expect(ours.message.metadata, context).toEqual(reference.assistant?.metadata);
      });
    });

    it("should take the message id from the stream like the AI SDK client", async () => {
      const { reference, ours } = await runBoth(toWire(chunks));
      const startChunk = chunks.find((chunk) => chunk.type === "start");
      const messageId = startChunk && "messageId" in startChunk ? startChunk.messageId : undefined;

      if (messageId === undefined) {
        // Both sides keep the id they generated locally
        expect(ours.message.id).toBe("local");
        expect(reference.assistant === undefined || reference.assistant.id.startsWith("ref-")).toBe(true);
      } else {
        expect(ours.message.id).toBe(messageId);
        expect(reference.assistant?.id).toBe(messageId);
      }
    });
  });

  describe("when comparing leniency", () => {
    const cases: { name: string; chunks: { type: string; [key: string]: unknown }[] }[] = [
      { name: "text-delta before text-start", chunks: [{ type: "text-delta", id: "t1", delta: "x" }] },
      { name: "text-end without text-start", chunks: [{ type: "text-end", id: "t1" }] },
      { name: "reasoning-delta before reasoning-start", chunks: [{ type: "reasoning-delta", id: "r1", delta: "x" }] },
      { name: "reasoning-end without reasoning-start", chunks: [{ type: "reasoning-end", id: "r1" }] },
      {
        name: "tool-input-delta before tool-input-start",
        chunks: [{ type: "tool-input-delta", toolCallId: "c1", inputTextDelta: "{" }],
      },
      {
        name: "tool-output-available for an unknown tool call",
        chunks: [{ type: "tool-output-available", toolCallId: "nope", output: 1 }],
      },
      {
        name: "tool-output-error for an unknown tool call",
        chunks: [{ type: "tool-output-error", toolCallId: "nope", errorText: "x" }],
      },
      {
        name: "tool-output-denied for an unknown tool call",
        chunks: [{ type: "tool-output-denied", toolCallId: "nope" }],
      },
      {
        name: "tool-approval-request for an unknown tool call",
        chunks: [{ type: "tool-approval-request", toolCallId: "nope", approvalId: "a1" }],
      },
      {
        name: "tool-approval-response for an unknown approval",
        chunks: [{ type: "tool-approval-response", approvalId: "nope", approved: true }],
      },
      { name: "an unknown chunk type", chunks: [{ type: "brand-new-chunk", value: 1 }] },
      { name: "a chunk with a wrong-typed field", chunks: [{ type: "text-start", id: 42 }] },
    ];

    it.each(cases)("should keep going on $name, where the AI SDK client fails the stream", async ({ chunks }) => {
      const wire = toWire([{ type: "start", messageId: "msg-1" }, ...chunks, { type: "finish" }]);

      const reference = await runReference(wire);
      expect(reference.status).toBe("error");
      expect(reference.error).toBeInstanceOf(Error);

      const ours = runOurs(wire);
      expect(ours.events.at(-1)).toEqual({ type: "finish" });
      expect(ours.events.some((event) => event.type === "error")).toBe(false);
    });
  });
});

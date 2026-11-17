/**
 * Type-level tests for the inference helpers against the real AI SDK (v7) and TanStack AI (1.x) tool definitions.
 */
import type {
  ChatMessageType,
  ChatToolCallType,
  ChatToolPartType,
  ChatToolResultType,
  InferAISDKChatTypes,
  InferAISDKData,
  InferAISDKMetadata,
  InferAISDKTools,
  InferChatTools,
  InferToolInput,
  InferToolOutput,
} from "@hyper-fetch/ai";
import type {
  InferToolInput as TanstackInferToolInput,
  InferToolOutput as TanstackInferToolOutput,
} from "@tanstack/ai";
import { toolDefinition } from "@tanstack/ai";
import type { InferUITools, UIMessage } from "ai";
import { dynamicTool, tool } from "ai";
import { z } from "zod";

const aiTools = {
  getWeather: tool({
    description: "Weather",
    inputSchema: z.object({ city: z.string(), unit: z.enum(["C", "F"]).optional() }),
    execute: async ({ city }) => ({ city, temperature: 21 }),
  }),
  // Client tool: schemas only
  askConfirmation: tool({
    inputSchema: z.object({ question: z.string() }),
    outputSchema: z.object({ confirmed: z.boolean() }),
  }),
  // Both an execute function and an output schema
  search: tool({
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.object({ hits: z.array(z.string()) }),
    execute: async ({ query }) => ({ hits: [query] }),
  }),
  // Streams preliminary results
  research: tool({
    inputSchema: z.object({ topic: z.string() }),
    async *execute({ topic }) {
      yield { status: "working" as const, topic };
      yield { status: "done" as const, topic };
    },
  }),
  now: tool({ inputSchema: z.object({}), execute: async () => "12:00" }),
  transformed: tool({
    inputSchema: z.object({ count: z.string().transform(Number), tags: z.array(z.string()).default([]) }),
    execute: async ({ count, tags }) => count + tags.length,
  }),
};

type AIMessage = UIMessage<
  { model: string; tokens?: number },
  { weather: { city: string }; progress: number },
  InferUITools<typeof aiTools>
>;

const tanstackTools = [
  toolDefinition({
    name: "getWeather",
    description: "Weather",
    inputSchema: z.object({ city: z.string() }),
    outputSchema: z.object({ temperature: z.number() }),
  }).server(async () => ({ temperature: 1 })),
  toolDefinition({
    name: "getLocation",
    description: "Client tool",
    inputSchema: z.object({ precise: z.boolean() }),
    outputSchema: z.object({ city: z.string() }),
  }),
  toolDefinition({
    name: "deleteFile",
    description: "Needs approval",
    needsApproval: true,
    inputSchema: z.object({ path: z.string() }),
    outputSchema: z.object({ deleted: z.boolean() }),
  }).server(async () => ({ deleted: true })),
  toolDefinition({
    name: "clientSide",
    description: "Implemented in the browser",
    inputSchema: z.object({ id: z.number() }),
    outputSchema: z.object({ ok: z.literal(true) }),
  }).client(async () => ({ ok: true as const })),
] as const;

describe("Inference types", () => {
  describe("when inferring from AI SDK tool sets", () => {
    type Tools = InferChatTools<typeof aiTools>;

    it("should infer exactly what AI SDK's InferUITools infers", () => {
      expectTypeOf<Tools>().toEqualTypeOf<InferUITools<typeof aiTools>>();
      expectTypeOf<keyof Tools>().toEqualTypeOf<keyof typeof aiTools>();
    });

    it("should infer inputs from schemas and outputs from execute or the output schema", () => {
      expectTypeOf<Tools["getWeather"]>().toEqualTypeOf<{
        input: { city: string; unit?: "C" | "F" | undefined };
        output: { city: string; temperature: number };
      }>();
      expectTypeOf<Tools["askConfirmation"]>().toEqualTypeOf<{
        input: { question: string };
        output: { confirmed: boolean };
      }>();
      expectTypeOf<Tools["search"]["output"]>().toEqualTypeOf<{ hits: string[] }>();
      expectTypeOf<Tools["now"]>().toEqualTypeOf<{ input: Record<string, never>; output: string }>();
    });

    it("should unwrap the results of streaming tools", () => {
      expectTypeOf<Tools["research"]["output"]>().toEqualTypeOf<
        { status: "working"; topic: string } | { status: "done"; topic: string }
      >();
    });

    it("should use the parsed input of schemas that transform", () => {
      expectTypeOf<Tools["transformed"]["input"]>().toEqualTypeOf<{ count: number; tags: string[] }>();
      expectTypeOf<Tools["transformed"]["output"]>().toEqualTypeOf<number>();
    });

    it("should fall back to unknown for dynamic tools and tools without types", () => {
      const dynamic = dynamicTool({ inputSchema: z.object({ key: z.string() }), execute: async () => 1 });
      expectTypeOf<InferToolInput<typeof dynamic>>().toEqualTypeOf<unknown>();
      expectTypeOf<InferToolInput<{ description: string }>>().toEqualTypeOf<unknown>();
      expectTypeOf<InferToolOutput<{ description: string }>>().toEqualTypeOf<unknown>();
      expectTypeOf<InferToolOutput<{ execute: () => void }>>().toEqualTypeOf<void>();
      expectTypeOf<InferChatTools<Record<never, never>>>().toEqualTypeOf<{}>();
    });
  });

  describe("when inferring from an AI SDK UIMessage", () => {
    type Types = InferAISDKChatTypes<AIMessage>;

    it("should infer metadata, data parts and tools", () => {
      expectTypeOf<Types["metadata"]>().toEqualTypeOf<{ model: string; tokens?: number }>();
      expectTypeOf<Types["data"]>().toEqualTypeOf<{ weather: { city: string }; progress: number }>();
      expectTypeOf<Types["tools"]>().toEqualTypeOf<InferUITools<typeof aiTools>>();
      expectTypeOf<InferAISDKMetadata<AIMessage>>().toEqualTypeOf<Types["metadata"]>();
      expectTypeOf<InferAISDKData<AIMessage>>().toEqualTypeOf<Types["data"]>();
      expectTypeOf<InferAISDKTools<AIMessage>>().toEqualTypeOf<Types["tools"]>();
    });

    it("should fall back to open types for an untyped UIMessage", () => {
      type Open = InferAISDKChatTypes<UIMessage>;
      expectTypeOf<Open["metadata"]>().toEqualTypeOf<unknown>();
      expectTypeOf<Open["data"]>().toEqualTypeOf<{ [x: string]: unknown }>();
      expectTypeOf<Open["tools"][string]>().toEqualTypeOf<{ input: unknown; output: unknown }>();
      expectTypeOf<InferAISDKMetadata<{ id: string }>>().toEqualTypeOf<unknown>();
    });

    it("should type messages, tool parts, tool calls and tool results of the chat", () => {
      expectTypeOf<ChatMessageType<Types>["metadata"]>().toEqualTypeOf<
        { model: string; tokens?: number } | undefined
      >();
      expectTypeOf<ChatToolPartType<Types>["toolName"]>().toEqualTypeOf<keyof typeof aiTools>();

      const narrow = (part: ChatToolPartType<Types>, call: ChatToolCallType<Types>) => {
        if (part.toolName === "getWeather" && part.state === "output-available") {
          expectTypeOf(part.output).toEqualTypeOf<{ city: string; temperature: number }>();
          expectTypeOf(part.input.city).toEqualTypeOf<string>();
        }
        if (part.toolName === "research" && part.state === "input-streaming") {
          expectTypeOf(part.input).toEqualTypeOf<{ topic?: string } | undefined>();
        }
        if (part.state === "approval-requested") {
          expectTypeOf(part.approval.id).toEqualTypeOf<string>();
        }
        if (part.state === "output-denied") {
          expectTypeOf(part.approval.approved).toEqualTypeOf<false>();
        }
        if (call.toolName === "askConfirmation") {
          expectTypeOf(call.input).toEqualTypeOf<{ question: string }>();
        }
      };
      expect(narrow).toBeTypeOf("function");

      const results = () => {
        const ok: ChatToolResultType<Types> = { tool: "askConfirmation", toolCallId: "c", output: { confirmed: true } };
        const failed: ChatToolResultType<Types> = {
          tool: "getWeather",
          toolCallId: "c",
          state: "output-error",
          errorText: "x",
        };
        // @ts-expect-error - the output of another tool
        const wrong: ChatToolResultType<Types> = { tool: "askConfirmation", toolCallId: "c", output: "12:00" };
        // @ts-expect-error - not a tool of this chat
        const unknown: ChatToolResultType<Types> = { tool: "nope", toolCallId: "c", output: 1 };
        return [ok, failed, wrong, unknown];
      };
      expect(results).toBeTypeOf("function");
    });
  });

  describe("when inferring from TanStack AI tool definitions", () => {
    type Tools = InferChatTools<typeof tanstackTools>;
    type Definitions = (typeof tanstackTools)[number];
    type ByName<Name extends string> = Extract<Definitions, { name: Name }>;

    it("should key the tools by their literal names", () => {
      expectTypeOf<keyof Tools>().toEqualTypeOf<"getWeather" | "getLocation" | "deleteFile" | "clientSide">();
    });

    it("should infer exactly what TanStack AI's own helpers infer", () => {
      expectTypeOf<Tools["getWeather"]["input"]>().toEqualTypeOf<TanstackInferToolInput<ByName<"getWeather">>>();
      expectTypeOf<Tools["getWeather"]["output"]>().toEqualTypeOf<TanstackInferToolOutput<ByName<"getWeather">>>();
      expectTypeOf<Tools["getLocation"]["input"]>().toEqualTypeOf<TanstackInferToolInput<ByName<"getLocation">>>();
      expectTypeOf<Tools["getLocation"]["output"]>().toEqualTypeOf<TanstackInferToolOutput<ByName<"getLocation">>>();
      expectTypeOf<Tools["deleteFile"]["input"]>().toEqualTypeOf<TanstackInferToolInput<ByName<"deleteFile">>>();
      expectTypeOf<Tools["deleteFile"]["output"]>().toEqualTypeOf<TanstackInferToolOutput<ByName<"deleteFile">>>();
      expectTypeOf<Tools["clientSide"]["input"]>().toEqualTypeOf<TanstackInferToolInput<ByName<"clientSide">>>();
      expectTypeOf<Tools["clientSide"]["output"]>().toEqualTypeOf<TanstackInferToolOutput<ByName<"clientSide">>>();
    });

    it("should infer server, client and approval tools", () => {
      expectTypeOf<Tools["getWeather"]>().toEqualTypeOf<{ input: { city: string }; output: { temperature: number } }>();
      expectTypeOf<Tools["getLocation"]>().toEqualTypeOf<{ input: { precise: boolean }; output: { city: string } }>();
      expectTypeOf<Tools["deleteFile"]>().toEqualTypeOf<{ input: { path: string }; output: { deleted: boolean } }>();
      expectTypeOf<Tools["clientSide"]>().toEqualTypeOf<{ input: { id: number }; output: { ok: true } }>();
    });

    it("should infer from mutable arrays and leave out tools without a literal name", () => {
      const mutable = [tanstackTools[0], tanstackTools[1]];
      expectTypeOf<keyof InferChatTools<typeof mutable>>().toEqualTypeOf<"getWeather" | "getLocation">();
      expectTypeOf<InferChatTools<[]>>().toEqualTypeOf<{}>();
      expectTypeOf<InferChatTools<readonly { inputSchema: z.ZodString }[]>>().toEqualTypeOf<{}>();
    });
  });
});

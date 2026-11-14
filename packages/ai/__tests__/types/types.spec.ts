import type {
  ChatDataEventType,
  ChatMessageType,
  ChatPartType,
  ChatToolCallType,
  ChatToolPartType,
  InferAISDKChatTypes,
  InferChatTools,
  InferToolInput,
  InferToolOutput,
} from "@hyper-fetch/ai";
import { aiSDKProtocol, Chat } from "@hyper-fetch/ai";
import { Client } from "@hyper-fetch/core";
import { tool } from "ai";
import { z } from "zod";

type Types = {
  metadata: { createdAt: number };
  data: { progress: { percent: number }; note: string };
  tools: {
    search: { input: { query: string }; output: { hits: number } };
    now: { input: Record<string, never>; output: string };
  };
  state: { step: "plan" | "act" };
};

const request = new Client({ url: "http://types.test" }).createRequest<{ response: string; payload: unknown }>()({
  endpoint: "/chat",
  method: "POST",
});

describe("Types", () => {
  it("should narrow tool parts by name and state", () => {
    const describePart = (part: ChatPartType<Types>) => {
      if (part.type === "tool" && part.toolName === "search") {
        if (part.state === "output-available") {
          expectTypeOf(part.input).toEqualTypeOf<{ query: string }>();
          expectTypeOf(part.output).toEqualTypeOf<{ hits: number }>();
        }
        if (part.state === "input-streaming") {
          expectTypeOf(part.input).toEqualTypeOf<{ query?: string } | undefined>();
        }
        if (part.state === "output-error") {
          expectTypeOf(part.errorText).toEqualTypeOf<string>();
        }
      }
      if (part.type === "data" && part.name === "progress") {
        expectTypeOf(part.data).toEqualTypeOf<{ percent: number }>();
      }
      if (part.type === "tool") {
        expectTypeOf(part.toolName).toEqualTypeOf<"search" | "now">();
      }
    };
    expect(describePart).toBeTypeOf("function");
  });

  it("should type message metadata and chat state", () => {
    expectTypeOf<ChatMessageType<Types>["metadata"]>().toEqualTypeOf<{ createdAt: number } | undefined>();
    const chat = new Chat<Types>({ request, protocol: aiSDKProtocol(), state: { step: "plan" } });
    expectTypeOf(chat.state).toEqualTypeOf<{ step: "plan" | "act" } | undefined>();
    const check = () => {
      chat.setState({ step: "act" });
      // @ts-expect-error - invalid state
      chat.setState({ step: "sleep" });
    };
    expect(check).toBeTypeOf("function");
  });

  it("should type callbacks", () => {
    expectTypeOf<ChatToolCallType<Types>>().toEqualTypeOf<
      | { toolName: "search"; toolCallId: string; input: { query: string }; dynamic?: boolean }
      | { toolName: "now"; toolCallId: string; input: Record<string, never>; dynamic?: boolean }
    >();
    expectTypeOf<ChatDataEventType<Types>>().toEqualTypeOf<
      | { name: "progress"; id?: string; data: { percent: number }; transient?: boolean }
      | { name: "note"; id?: string; data: string; transient?: boolean }
    >();

    const check = () =>
      new Chat<Types>({
        request,
        protocol: aiSDKProtocol(),
        onToolCall: (call) => {
          if (call.toolName === "search") {
            expectTypeOf(call.input.query).toEqualTypeOf<string>();
          }
        },
        tools: {
          search: { execute: async ({ query }) => ({ hits: query.length }) },
          // @ts-expect-error - wrong output type
          now: { execute: async () => 1 },
        },
      });
    expect(check).toBeTypeOf("function");
  });

  it("should fall back to unknown without chat types", () => {
    expectTypeOf<ChatToolPartType["toolName"]>().toEqualTypeOf<string>();
    expectTypeOf<ChatMessageType["metadata"]>().toEqualTypeOf<unknown>();
  });

  it("should infer tools from an AI SDK tool set", () => {
    const tools = {
      weather: tool({
        inputSchema: z.object({ city: z.string() }),
        execute: async ({ city }) => ({ city, temperature: 1 }),
      }),
      confirm: tool({ inputSchema: z.object({ question: z.string() }), outputSchema: z.boolean() }),
    };
    type Tools = InferChatTools<typeof tools>;
    expectTypeOf<Tools["weather"]>().toEqualTypeOf<{
      input: { city: string };
      output: { city: string; temperature: number };
    }>();
    expectTypeOf<Tools["confirm"]>().toEqualTypeOf<{ input: { question: string }; output: boolean }>();
  });

  it("should infer tools from TanStack-style tool arrays with Standard Schemas", () => {
    const tools = [
      {
        name: "getTime" as const,
        inputSchema: z.object({ zone: z.string() }),
        outputSchema: z.object({ time: z.string() }),
      },
      { name: "ping" as const, inputSchema: z.object({}), execute: async () => "pong" as const },
    ];
    type Tools = InferChatTools<typeof tools>;
    expectTypeOf<Tools["getTime"]>().toEqualTypeOf<{ input: { zone: string }; output: { time: string } }>();
    expectTypeOf<Tools["ping"]["output"]>().toEqualTypeOf<"pong">();
  });

  it("should unwrap streaming tool outputs", () => {
    type Streaming = { execute: (input: { n: number }) => AsyncIterable<{ partial: number }> };
    expectTypeOf<InferToolInput<Streaming>>().toEqualTypeOf<{ n: number }>();
    expectTypeOf<InferToolOutput<Streaming>>().toEqualTypeOf<{ partial: number }>();
    expectTypeOf<InferToolOutput<{ description: string }>>().toEqualTypeOf<unknown>();
  });

  it("should infer chat types from an AI SDK UIMessage shape", () => {
    type Message = {
      id: string;
      role: "user" | "assistant";
      metadata?: { model: string };
      parts: (
        | { type: "text"; text: string }
        | { type: "data-status"; id?: string; data: { ok: boolean } }
        | { type: "tool-lookup"; toolCallId: string; state: "input-available"; input: { id: number } }
        | {
            type: "tool-lookup";
            toolCallId: string;
            state: "output-available";
            input: { id: number };
            output: { name: string };
          }
      )[];
    };
    type Inferred = InferAISDKChatTypes<Message>;
    expectTypeOf<Inferred["metadata"]>().toEqualTypeOf<{ model: string }>();
    expectTypeOf<Inferred["data"]>().toEqualTypeOf<{ status: { ok: boolean } }>();
    expectTypeOf<Inferred["tools"]>().toEqualTypeOf<{ lookup: { input: { id: number }; output: { name: string } } }>();
  });
});

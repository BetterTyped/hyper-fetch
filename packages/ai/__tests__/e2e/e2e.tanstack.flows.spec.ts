/**
 * @vitest-environment node
 *
 * End-to-end against the real TanStack AI (1.x) over real HTTP: multi-iteration agent loops, failing tools and denied
 * approvals - what the chat shows, and what the model is given on the next turn.
 */
import type { ChatMessageType, InferChatTools } from "@hyper-fetch/ai";
import { Chat, tanstackAIProtocol } from "@hyper-fetch/ai";
import { Client } from "@hyper-fetch/core";
import { createE2EServer } from "@hyper-fetch/testing";
import {
  chat,
  chatParamsFromRequestBody,
  toHttpResponse,
  toolDefinition,
  toServerSentEventsResponse,
} from "@tanstack/ai";
import type { FakeResponseStep } from "@tanstack/ai/testing";
import { fakeText } from "@tanstack/ai/testing";
import type http from "http";
import { z } from "zod";

const getWeather = toolDefinition({
  name: "getWeather",
  description: "Weather in a city",
  inputSchema: z.object({ city: z.string() }),
  outputSchema: z.object({ temperature: z.number() }),
}).server(async ({ city }) => ({ temperature: city.length * 3 }));

const explode = toolDefinition({
  name: "explode",
  description: "Always fails",
  inputSchema: z.object({ why: z.string() }),
}).server(async ({ why }) => {
  throw new Error(`Exploded: ${why}`);
});

const deleteFile = toolDefinition({
  name: "deleteFile",
  description: "Delete a file",
  needsApproval: true,
  inputSchema: z.object({ path: z.string() }),
  outputSchema: z.object({ deleted: z.boolean() }),
}).server(async () => ({ deleted: true }));

const serverTools = [getWeather, explode, deleteFile];

type ChatTypes = { tools: InferChatTools<typeof serverTools> };
type ModelMessage = { role: string; content?: unknown; toolCalls?: { id: string }[]; toolCallId?: string };

let fake = fakeText();
/** What the model was given in every model call */
let prompts: ModelMessage[][] = [];

/** Script the model and record what it is asked. */
const script = (responses: Exclude<FakeResponseStep, (...args: never[]) => unknown>[]) => {
  fake.setResponses(
    responses.map((response) => ({ request }: { request: { messages: unknown } }) => {
      prompts.push(structuredClone(request.messages) as ModelMessage[]);
      return response;
    }),
  );
};

const { route, startServer, stopServer } = createE2EServer();
let baseUrl: string;

const sendResponse = async (response: Response, res: http.ServerResponse) => {
  res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
  res.end(Buffer.from(await response.arrayBuffer()));
};

const runChat = async (body: Buffer) => {
  const params = await chatParamsFromRequestBody(JSON.parse(body.toString()));
  return chat({
    adapter: fake,
    threadId: params.threadId,
    runId: params.runId,
    parentRunId: params.parentRunId,
    resume: params.resume,
    messages: params.messages,
    tools: serverTools,
  });
};

beforeAll(async () => {
  route("POST", "/api/chat", async (_req, res, body) => {
    await sendResponse(toServerSentEventsResponse(await runChat(body)), res);
  });
  route("POST", "/api/chat-ndjson", async (_req, res, body) => {
    await sendResponse(toHttpResponse(await runChat(body)), res);
  });
  baseUrl = await startServer();
});

beforeEach(() => {
  fake = fakeText();
  prompts = [];
});

afterAll(async () => {
  await stopServer();
});

const endpoints = ["/api/chat", "/api/chat-ndjson"] as const;

const createChat = (endpoint: (typeof endpoints)[number]) => {
  const request = new Client({ url: baseUrl }).createRequest<{ response: string; payload: unknown }>()({
    endpoint,
    method: "POST",
  });
  return new Chat<ChatTypes>({ request, protocol: tanstackAIProtocol() });
};

/** Parts without ids, which the server generates */
const shape = (message: ChatMessageType<ChatTypes>) =>
  message.parts.map((part) => {
    if (part.type === "text" || part.type === "reasoning") {
      return { type: part.type, text: part.text, state: part.state };
    }
    if (part.type === "tool") {
      const { interruptId: _interruptId, ...rest } = part;
      return rest;
    }
    return part;
  });

describe("E2E [ TanStack AI server flows ]", () => {
  describe.each(endpoints)("when streaming from %s", (endpoint) => {
    it("should keep text before and after a server tool call apart and in order", async () => {
      script([
        {
          thinking: "I need the weather.",
          text: "Let me check. ",
          toolCalls: [{ id: "call-1", name: "getWeather", input: { city: "Oslo" } }],
        },
        { thinking: "Now I know.", text: "It is 12 degrees." },
        { text: "You are welcome." },
      ]);
      const chatInstance = createChat(endpoint);

      await chatInstance.sendMessage("Weather in Oslo?");

      expect(chatInstance.error).toBeUndefined();
      expect(shape(chatInstance.messages[1])).toEqual([
        { type: "step-start" },
        { type: "reasoning", text: "I need the weather.", state: "done" },
        { type: "text", text: "Let me check. ", state: "done" },
        {
          type: "tool",
          toolName: "getWeather",
          toolCallId: "call-1",
          state: "output-available",
          input: { city: "Oslo" },
          output: { temperature: 12 },
        },
        { type: "step-start" },
        { type: "reasoning", text: "Now I know.", state: "done" },
        { type: "text", text: "It is 12 degrees.", state: "done" },
      ]);

      // On the next turn the model gets the same order back: call, result, then the answer
      await chatInstance.sendMessage("Thanks");

      expect(chatInstance.error).toBeUndefined();
      expect(chatInstance.messages).toHaveLength(4);
      expect(prompts[2].map(({ role, content }) => ({ role, content }))).toEqual([
        { role: "user", content: "Weather in Oslo?" },
        { role: "assistant", content: "Let me check. " },
        { role: "tool", content: '{"temperature":12}' },
        { role: "assistant", content: "It is 12 degrees." },
        { role: "user", content: "Thanks" },
      ]);
      expect(prompts[2][1].toolCalls?.map((call) => call.id)).toEqual(["call-1"]);
    });

    it("should show a failing server tool as an error and tell the model why on the next turn", async () => {
      script([
        { toolCalls: [{ id: "call-1", name: "explode", input: { why: "disk full" } }] },
        { text: "The tool failed." },
        { text: "Sorry about that." },
      ]);
      const chatInstance = createChat(endpoint);

      await chatInstance.sendMessage("Do it");

      expect(chatInstance.error).toBeUndefined();
      expect(shape(chatInstance.messages[1])).toEqual([
        { type: "step-start" },
        {
          type: "tool",
          toolName: "explode",
          toolCallId: "call-1",
          state: "output-error",
          input: { why: "disk full" },
          errorText: "Exploded: disk full",
        },
        { type: "step-start" },
        { type: "text", text: "The tool failed.", state: "done" },
      ]);

      await chatInstance.sendMessage("What happened?");

      expect(chatInstance.error).toBeUndefined();
      const toolMessage = prompts[2].find((message) => message.role === "tool");
      expect(toolMessage).toMatchObject({ toolCallId: "call-1", content: '{"error":"Exploded: disk full"}' });
    });

    it("should show a denied approval as denied", async () => {
      script([
        { text: "Deleting. ", toolCalls: [{ id: "call-1", name: "deleteFile", input: { path: "/tmp/x" } }] },
        { text: "I did not delete it." },
      ]);
      const chatInstance = createChat(endpoint);

      await chatInstance.sendMessage("Delete /tmp/x");
      const pending = chatInstance.messages[1].parts.find((part) => part.type === "tool");
      if (pending?.type !== "tool" || pending.state !== "approval-requested") {
        throw new Error("Expected an approval request");
      }
      chatInstance.addToolApprovalResponse({ id: pending.approval.id, approved: false, reason: "Too risky" });
      await chatInstance.sendMessage();

      expect(chatInstance.error).toBeUndefined();
      expect(shape(chatInstance.messages[1])).toEqual([
        { type: "step-start" },
        { type: "text", text: "Deleting. ", state: "done" },
        {
          type: "tool",
          toolName: "deleteFile",
          toolCallId: "call-1",
          state: "output-denied",
          input: { path: "/tmp/x" },
          approval: {
            id: "approval_call-1",
            reason: "Approval required to run deleteFile",
            approved: false,
            responseReason: "Too risky",
          },
        },
        { type: "step-start" },
        { type: "text", text: "I did not delete it.", state: "done" },
      ]);
    });

    it("should run several iterations with parallel tool calls", async () => {
      script([
        {
          toolCalls: [
            { id: "a", name: "getWeather", input: { city: "Oslo" } },
            { id: "b", name: "explode", input: { why: "x" } },
          ],
        },
        { text: "One more. ", toolCalls: [{ id: "c", name: "getWeather", input: { city: "Rome" } }] },
        { text: "Done." },
      ]);
      const chatInstance = createChat(endpoint);

      await chatInstance.sendMessage("Go");

      expect(chatInstance.error).toBeUndefined();
      expect(chatInstance.status).toBe("ready");
      expect(
        shape(chatInstance.messages[1]).map((part) => ("state" in part ? `${part.type}:${part.state}` : part.type)),
      ).toEqual([
        "step-start",
        "tool:output-available",
        "tool:output-error",
        "step-start",
        "text:done",
        "tool:output-available",
        "step-start",
        "text:done",
      ]);
      expect(prompts).toHaveLength(3);
    });
  });
});

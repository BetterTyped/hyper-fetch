/**
 * @vitest-environment node
 *
 * End-to-end against the real TanStack AI (1.x): a TanStack `chat()` with its fake text adapter streams over real HTTP
 * (SSE and NDJSON), and the HyperFetch chat consumes it - including client tools and approvals resumed with interrupts.
 */
import type { InferChatTools } from "@hyper-fetch/ai";
import { Chat, lastAssistantMessageIsCompleteWithToolCalls, tanstackAIProtocol } from "@hyper-fetch/ai";
import { Client } from "@hyper-fetch/core";
import { createE2EServer } from "@hyper-fetch/testing";
import {
  chat,
  chatParamsFromRequestBody,
  toHttpResponse,
  toolDefinition,
  toServerSentEventsResponse,
} from "@tanstack/ai";
import { fakeText } from "@tanstack/ai/testing";
import type http from "http";
import { z } from "zod";

/* -------------------------------------------------------------------------------------------------
 * "Server" - what a user would write with TanStack AI
 * -----------------------------------------------------------------------------------------------*/

const getWeather = toolDefinition({
  name: "getWeather",
  description: "Weather in a city",
  inputSchema: z.object({ city: z.string() }),
  outputSchema: z.object({ temperature: z.number() }),
}).server(async ({ city }) => ({ temperature: city.length * 3 }));

// Client tool - executed in the browser
const getLocation = toolDefinition({
  name: "getLocation",
  description: "Where the user is",
  inputSchema: z.object({ precise: z.boolean() }),
  outputSchema: z.object({ city: z.string() }),
});

const deleteFile = toolDefinition({
  name: "deleteFile",
  description: "Delete a file",
  needsApproval: true,
  inputSchema: z.object({ path: z.string() }),
  outputSchema: z.object({ deleted: z.boolean() }),
}).server(async () => ({ deleted: true }));

const serverTools = [getWeather, getLocation, deleteFile];

let fake = fakeText();

const { route, startServer, stopServer } = createE2EServer();
let baseUrl: string;

const sendResponse = async (response: Response, res: http.ServerResponse) => {
  res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
  const reader = (response.body as ReadableStream<Uint8Array>).getReader();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    res.write(value);
  }
  res.end();
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
});

afterAll(async () => {
  await stopServer();
});

/* -------------------------------------------------------------------------------------------------
 * "Client" - HyperFetch
 * -----------------------------------------------------------------------------------------------*/

type ChatTypes = { tools: InferChatTools<typeof serverTools> };

const createChat = (
  endpoint: "/api/chat" | "/api/chat-ndjson" = "/api/chat",
  options: Partial<ConstructorParameters<typeof Chat<ChatTypes>>[0]> = {},
) => {
  const request = new Client({ url: baseUrl }).createRequest<{ response: string; payload: unknown }>()({
    endpoint,
    method: "POST",
  });
  return new Chat<ChatTypes>({ request, protocol: tanstackAIProtocol(), ...options });
};

const textOf = (chatInstance: Chat<ChatTypes>) =>
  chatInstance.messages
    .at(-1)
    ?.parts.map((part) => (part.type === "text" ? part.text : ""))
    .join("");

describe("E2E [ TanStack AI server ]", () => {
  it.each(["/api/chat", "/api/chat-ndjson"] as const)("should stream a text answer from %s", async (endpoint) => {
    fake.setResponses([{ text: "Hello from TanStack AI" }]);
    const chatInstance = createChat(endpoint);

    await chatInstance.sendMessage("Hi");

    expect(chatInstance.error).toBeUndefined();
    expect(chatInstance.status).toBe("ready");
    expect(textOf(chatInstance)).toBe("Hello from TanStack AI");
  });

  it("should show server tool calls and results", async () => {
    fake.setResponses([
      { toolCalls: [{ id: "call-weather", name: "getWeather", input: { city: "Oslo" } }] },
      { text: "It is 12 degrees" },
    ]);
    const chatInstance = createChat();

    await chatInstance.sendMessage("Weather in Oslo?");

    const tool = chatInstance.messages[1].parts.find((part) => part.type === "tool");
    expect(tool).toMatchObject({
      toolName: "getWeather",
      state: "output-available",
      input: { city: "Oslo" },
      output: { temperature: 12 },
    });
    expect(textOf(chatInstance)).toContain("It is 12 degrees");
  });

  it("should run client tools and resume the interrupted run", async () => {
    fake.setResponses([
      { toolCalls: [{ id: "call-location", name: "getLocation", input: { precise: true } }] },
      { text: "You are in Paris" },
    ]);
    const execute = vi.fn(async ({ precise }: { precise: boolean }) => ({ city: precise ? "Paris" : "France" }));
    const chatInstance = createChat("/api/chat", {
      tools: { getLocation: { execute } },
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    });

    await chatInstance.sendMessage("Where am I?");
    await vi.waitFor(() => expect(textOf(chatInstance)).toContain("You are in Paris"));
    await vi.waitFor(() => expect(chatInstance.status).toBe("ready"));

    expect(chatInstance.error).toBeUndefined();
    expect(execute).toHaveBeenCalledWith({ precise: true }, { toolCallId: "call-location" });
    expect(chatInstance.messages[1].parts.find((part) => part.type === "tool")).toMatchObject({
      toolName: "getLocation",
      state: "output-available",
      output: { city: "Paris" },
      interruptId: "client_tool_call-location",
    });
  });

  it("should ask for approval and run the tool once approved", async () => {
    fake.setResponses([
      { toolCalls: [{ id: "call-delete", name: "deleteFile", input: { path: "/tmp/x" } }] },
      { text: "File deleted" },
    ]);
    const chatInstance = createChat();

    await chatInstance.sendMessage("Delete /tmp/x");
    const pending = chatInstance.messages[1].parts.find((part) => part.type === "tool");
    expect(pending).toMatchObject({ toolName: "deleteFile", state: "approval-requested" });
    if (pending?.type !== "tool" || pending.state !== "approval-requested") {
      throw new Error("Expected an approval");
    }

    chatInstance.addToolApprovalResponse({ id: pending.approval.id, approved: true });
    await chatInstance.sendMessage();

    expect(chatInstance.error).toBeUndefined();
    expect(chatInstance.messages[1].parts.find((part) => part.type === "tool")).toMatchObject({
      state: "output-available",
      output: { deleted: true },
    });
    expect(textOf(chatInstance)).toContain("File deleted");
  });

  it("should report server errors", async () => {
    fake.setResponses([{ error: "Provider unavailable" }]);
    const chatInstance = createChat();

    await chatInstance.sendMessage("Hi");

    expect(chatInstance.status).toBe("error");
    expect((chatInstance.error as Error).message).toContain("Provider unavailable");
  });
});

describe("E2E types [ TanStack AI ]", () => {
  it("should derive tool types from TanStack tool definitions", () => {
    expectTypeOf<ChatTypes["tools"]["getWeather"]>().toEqualTypeOf<{
      input: { city: string };
      output: { temperature: number };
    }>();
    expectTypeOf<ChatTypes["tools"]["getLocation"]>().toEqualTypeOf<{
      input: { precise: boolean };
      output: { city: string };
    }>();
    expectTypeOf<keyof ChatTypes["tools"]>().toEqualTypeOf<"getWeather" | "getLocation" | "deleteFile">();
  });
});

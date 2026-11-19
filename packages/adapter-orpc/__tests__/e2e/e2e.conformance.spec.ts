/**
 * @vitest-environment node
 */
import type { RequestInstance } from "@hyper-fetch/core";
import { createClient } from "@hyper-fetch/core";
import { createORPCClient, ORPCError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";

import { OrpcAdapter } from "../../src/adapter";
import type { AppRouter } from "./e2e.orpc-server";
import { createAppRouter, createE2EOrpcServer } from "./e2e.orpc-server";

type WireRequest = { method: string; url: string; contentType: string | null; body: string };

/**
 * Every request leaves through `fetch`, so both clients are compared on what they actually send.
 */
const recordFetch = () => {
  const realFetch = globalThis.fetch;
  const sent: WireRequest[] = [];

  const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const request = new Request(input, init);
    const body = request.method === "GET" ? "" : await request.clone().text();
    sent.push({
      method: request.method,
      url: request.url,
      contentType: request.headers.get("content-type"),
      body,
    });
    return realFetch(request);
  });

  return { sent, spy };
};

const date = new Date("2024-05-06T07:08:09.010Z");

/**
 * Inputs the server validates. Top level falsy inputs like `false` or `""` are left out, because
 * `setPayload` of the core drops them until the core fix from the tRPC adapter lands.
 */
const inputs: [name: string, procedure: string[], input: unknown][] = [
  ["no input", ["health"], undefined],
  ["a number", ["double"], 21],
  ["a negative float", ["double"], -1.5],
  ["true", ["negate"], true],
  ["unicode", ["shout"], "zażółć 🎡 日本語 & ?=#"],
  ["an object", ["user", "byId"], { id: 1 }],
  ["an optional input", ["user", "list"], { limit: 1 }],
  ["a missing optional input", ["user", "list"], undefined],
  ["special types", ["types", "nextDay"], { date, total: 12_345_678_901_234_567_890n }],
];

describe("Orpc Adapter [ Conformance ]", () => {
  const { startServer, stopServer } = createE2EOrpcServer(createAppRouter());

  let baseUrl = "";

  const createHf = (queryMethod: "GET" | "POST" = "POST") => {
    return createClient({ url: baseUrl, mode: "client" }).setAdapter(OrpcAdapter({ queryMethod }));
  };

  const createOfficial = (method: "GET" | "POST" = "POST") => {
    return createORPCClient<RouterClient<AppRouter>>(new RPCLink({ url: baseUrl, method }));
  };

  /** Calls the procedure with the official client, which throws the errors */
  const callOfficial = async (method: "GET" | "POST", procedure: string[], input: unknown) => {
    const official = createOfficial(method) as unknown as Record<string, unknown>;
    const call = procedure.reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], official);

    try {
      return { data: await (call as (value: unknown) => Promise<unknown>)(input), error: null };
    } catch (error) {
      return { data: null, error: error instanceof ORPCError ? error.toJSON() : error };
    }
  };

  const callHf = async ({
    method,
    queryMethod,
    procedure,
    input,
  }: {
    method: "QUERY" | "MUTATION";
    queryMethod: "GET" | "POST";
    procedure: string[];
    input: unknown;
  }) => {
    const request: RequestInstance = createHf(queryMethod).createRequest<{ response: unknown; payload: unknown }>()({
      endpoint: procedure.join("/"),
      method,
    });
    const response = await request.send({ payload: input });
    return { data: response.data, error: response.error };
  };

  beforeAll(async () => {
    baseUrl = `${await startServer()}/rpc`;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await stopServer();
  });

  describe("when sending with POST", () => {
    it.each(inputs)("should match the official client for %s", async (_name, procedure, input) => {
      const { sent } = recordFetch();

      const official = await callOfficial("POST", procedure, input);
      const query = await callHf({ method: "QUERY", queryMethod: "POST", procedure, input });
      const mutation = await callHf({ method: "MUTATION", queryMethod: "POST", procedure, input });

      expect(sent).toHaveLength(3);
      expect(sent[1]).toStrictEqual(sent[0]);
      expect(sent[2]).toStrictEqual(sent[0]);
      expect(query).toStrictEqual(official);
      expect(mutation).toStrictEqual(official);
    });
  });

  describe("when sending with GET", () => {
    it.each(inputs)("should match the official client for %s", async (_name, procedure, input) => {
      const { sent } = recordFetch();

      const official = await callOfficial("GET", procedure, input);
      const query = await callHf({ method: "QUERY", queryMethod: "GET", procedure, input });

      expect(sent).toHaveLength(2);
      expect(sent[0].method).toBe("GET");
      expect(sent[1]).toStrictEqual(sent[0]);
      expect(query).toStrictEqual(official);
    });

    it("should fall back to POST for a long input like the official client", async () => {
      const { sent } = recordFetch();
      const input = "a".repeat(3000);

      const official = await callOfficial("GET", ["shout"], input);
      const query = await callHf({ method: "QUERY", queryMethod: "GET", procedure: ["shout"], input });

      expect(sent.map(({ method }) => method)).toStrictEqual(["POST", "POST"]);
      expect(sent[1]).toStrictEqual(sent[0]);
      expect(query).toStrictEqual(official);
    });
  });

  describe("when the procedure fails", () => {
    it.each([
      ["a defined error", ["user", "byId"], { id: 99 }],
      ["a common error", ["fail"], { code: "CONFLICT" }],
      ["a custom error", ["fail"], { code: "OUT_OF_STOCK", status: 418 }],
      ["a crash", ["crash"], undefined],
      ["an invalid input", ["double"], "not a number"],
      ["an invalid output", ["badOutput"], undefined],
      ["a middleware error", ["me"], undefined],
    ])("should return the same error as the official client for %s", async (_name, procedure, input) => {
      const official = await callOfficial("POST", procedure, input);
      const query = await callHf({ method: "QUERY", queryMethod: "POST", procedure, input });

      expect(official.error).not.toBeNull();
      expect(query).toStrictEqual(official);
    });
  });

  describe("when sending files", () => {
    it("should send the same multipart body as the official client", async () => {
      const { sent } = recordFetch();
      const input = { name: "Notes", file: new File(["content"], "notes.txt", { type: "text/plain" }) };

      const official = await callOfficial("GET", ["types", "upload"], input);
      const query = await callHf({ method: "QUERY", queryMethod: "GET", procedure: ["types", "upload"], input });

      expect(sent.map(({ method }) => method)).toStrictEqual(["POST", "POST"]);
      // The multipart boundary is random, everything around it has to match
      const [officialBoundary, hfBoundary] = sent.map(({ contentType }) => contentType?.split("boundary=")[1] ?? "");
      expect(sent[1].body.replaceAll(hfBoundary, "")).toBe(sent[0].body.replaceAll(officialBoundary, ""));
      expect(query).toStrictEqual(official);
    });
  });
});

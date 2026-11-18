/**
 * @vitest-environment node
 */
import { createClient, createSdk, getErrorMessage } from "@hyper-fetch/core";
import type { TRPCError } from "@trpc/server";
import superjson from "superjson";

import type { TrpcErrorType, TrpcSchema } from "../../src/adapter";
import { TrpcAdapter } from "../../src/adapter";
import type { AppRouter, Gate, TransformerRouter } from "./e2e.trpc-server";
import { createAppRouter, createE2ETrpcServer, createGate, createTransformerRouter } from "./e2e.trpc-server";

describe("Trpc Adapter [ E2E ]", () => {
  let gate: Gate = createGate();

  const appServer = createE2ETrpcServer(createAppRouter(() => gate));
  const transformerServer = createE2ETrpcServer(createTransformerRouter());

  let url = "";
  let transformerUrl = "";

  const createAppClient = () => createClient({ url, mode: "client" }).setAdapter(TrpcAdapter());
  const createTransformerClient = () =>
    createClient({ url: transformerUrl }).setAdapter(TrpcAdapter({ transformer: superjson }));

  let client = createAppClient();
  let transformerClient = createTransformerClient();

  beforeAll(async () => {
    url = await appServer.startServer();
    transformerUrl = await transformerServer.startServer();
  });

  beforeEach(() => {
    gate = createGate();
    appServer.requests.length = 0;
    transformerServer.requests.length = 0;
    client = createAppClient();
    transformerClient = createTransformerClient();
  });

  afterEach(() => {
    gate.release();
    client.clear();
    transformerClient.clear();
  });

  afterAll(async () => {
    await appServer.stopServer();
    await transformerServer.stopServer();
  });

  describe("when calling queries", () => {
    it("should call a query without an input", async () => {
      const response = await client.createRequest<{ response: string }>()({ endpoint: "health" }).send();

      expect(response.data).toBe("ok");
      expect(response.status).toBe(200);
      expect(response.success).toBe(true);
      expect(response.extra?.headers["content-type"]).toContain("application/json");
      expect(appServer.requests).toStrictEqual([{ method: "GET", url: "/health", contentType: undefined }]);
    });

    it("should call a nested query with an input", async () => {
      const response = await client
        .createRequest<{ response: { id: number; name: string }; payload: { id: number } }>()({
          endpoint: "user.byId",
        })
        .setPayload({ id: 2 })
        .send();

      expect(response.data).toStrictEqual({ id: 2, name: "Jane" });
      expect(appServer.requests[0].method).toBe("GET");
      expect(appServer.requests[0].url).toBe(`/user.byId?input=${encodeURIComponent('{"id":2}')}`);
    });

    it("should call a query with a primitive input", async () => {
      const response = await client
        .createRequest<{ response: number; payload: number }>()({ endpoint: "double" })
        .setPayload(21)
        .send();

      expect(response.data).toBe(42);
    });

    it("should send a zero input", async () => {
      const response = await client
        .createRequest<{ response: number; payload: number }>()({ endpoint: "double" })
        .setPayload(0)
        .send();

      expect(response.data).toBe(0);
      expect(response.success).toBe(true);
      expect(appServer.requests[0].url).toBe("/double?input=0");
    });

    it.each([
      { endpoint: "double", input: 0, output: 0 },
      { endpoint: "negate", input: true, output: false },
    ])("should keep the $output output of $endpoint in the cache", async ({ endpoint, input, output }) => {
      const request = client.createRequest<{ response: unknown; payload: unknown }>()({ endpoint }).setPayload(input);

      const response = await request.send();

      expect(response.data).toBe(output);
      expect(client.cache.get(request.cacheKey)?.data).toBe(output);
    });

    it("should send a false input", async () => {
      const response = await client
        .createRequest<{ response: boolean; payload: boolean }>()({ endpoint: "negate" })
        .send({ payload: false });

      expect(response.data).toBe(true);
      expect(appServer.requests[0].url).toBe("/negate?input=false");
    });

    it("should keep the responses of different inputs in separate cache entries", async () => {
      const request = client.createRequest<{ response: { name: string }; payload: { id: number } }>()({
        endpoint: "user.byId",
      });
      const first = request.setPayload({ id: 1 });
      const second = request.setPayload({ id: 2 });

      await first.send();
      await second.send();

      expect(client.cache.get<{ name: string }, Error>(first.cacheKey)?.data?.name).toBe("John");
      expect(client.cache.get<{ name: string }, Error>(second.cacheKey)?.data?.name).toBe("Jane");
    });

    it("should deduplicate only the calls with the same input", async () => {
      const request = client.createRequest<{ response: { name: string }; payload: { id: number } }>()({
        endpoint: "user.byId",
      });

      const responses = await Promise.all([
        request.setPayload({ id: 1 }).send(),
        request.setPayload({ id: 1 }).send(),
        request.setPayload({ id: 2 }).send(),
      ]);

      expect(responses.map(({ data }) => data?.name)).toStrictEqual(["John", "John", "Jane"]);
      expect(appServer.requests).toHaveLength(2);
    });
  });

  describe("when calling mutations", () => {
    it("should call a mutation with an input", async () => {
      const response = await client
        .createRequest<{ response: { id: number; name: string }; payload: { name: string } }>()({
          endpoint: "user.create",
          method: "MUTATION",
        })
        .setPayload({ name: "Jack" })
        .send();

      expect(response.data).toStrictEqual({ id: 3, name: "Jack" });
      expect(response.status).toBe(200);
      expect(appServer.requests).toStrictEqual([
        { method: "POST", url: "/user.create", contentType: "application/json" },
      ]);
    });

    it("should call a mutation with a primitive input", async () => {
      const response = await client
        .createRequest<{ response: string; payload: string }>()({ endpoint: "rename", method: "MUTATION" })
        .setPayload("jack")
        .send();

      expect(response.data).toBe("JACK");
    });

    it("should send an empty string input", async () => {
      const response = await client
        .createRequest<{ response: string; payload: string }>()({ endpoint: "rename", method: "MUTATION" })
        .setPayload("")
        .send();

      expect(response.data).toBe("");
      expect(response.success).toBe(true);
    });

    it("should call a mutation without an input and without a result", async () => {
      const response = await client.createRequest()({ endpoint: "noop", method: "MUTATION" }).send();

      expect(response.data).toBeNull();
      expect(response.error).toBeNull();
      expect(response.status).toBe(200);
      expect(response.success).toBe(true);
    });
  });

  describe("when the procedure fails", () => {
    const failRequest = () =>
      client.createRequest<{ response: never; payload: { code: TRPCError["code"] }; error: TrpcErrorType }>()({
        endpoint: "fail",
      });

    it.each([
      ["BAD_REQUEST", 400, -32_600],
      ["UNAUTHORIZED", 401, -32_001],
      ["FORBIDDEN", 403, -32_003],
      ["NOT_FOUND", 404, -32_004],
      ["CONFLICT", 409, -32_009],
      ["TOO_MANY_REQUESTS", 429, -32_029],
      ["INTERNAL_SERVER_ERROR", 500, -32_603],
    ] as const)("should map %s to the status %s and the code %s", async (code, status, jsonRpcCode) => {
      const response = await failRequest().setPayload({ code }).send();

      expect(response.data).toBeNull();
      expect(response.success).toBe(false);
      expect(response.status).toBe(status);
      expect(response.error).toMatchObject({
        message: `Failed with ${code}`,
        code: jsonRpcCode,
        data: { code, httpStatus: status, path: "fail" },
      });
    });

    it("should return the error exactly as the server sent it", async () => {
      const input = encodeURIComponent(JSON.stringify({ code: "FORBIDDEN" }));
      const raw = await fetch(`${url}/fail?input=${input}`).then((res) => res.json());

      const response = await failRequest().setPayload({ code: "FORBIDDEN" }).send();

      expect(Object.keys(raw)).toStrictEqual(["error"]);
      expect(response.error).toStrictEqual(raw.error);
    });

    it("should map an unexpected server error", async () => {
      const response = await client.createRequest()({ endpoint: "crash" }).send();

      expect(response.status).toBe(500);
      expect(response.error).toMatchObject({
        message: "Unexpected crash",
        data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500 },
      });
    });

    it("should map an unknown procedure", async () => {
      const response = await client.createRequest()({ endpoint: "user.unknown" }).send();

      expect(response.status).toBe(404);
      expect(response.error).toMatchObject({ data: { code: "NOT_FOUND", httpStatus: 404 } });
    });

    it("should map a wrong method", async () => {
      const response = await client.createRequest()({ endpoint: "user.create" }).send();

      expect(response.status).toBe(405);
      expect(response.error).toMatchObject({ data: { code: "METHOD_NOT_SUPPORTED", httpStatus: 405 } });
    });

    it("should map a failed input validation", async () => {
      const response = await client
        .createRequest<{ response: unknown; payload: { id: string } }>()({ endpoint: "user.byId" })
        .setPayload({ id: "1" })
        .send();

      expect(response.status).toBe(400);
      expect(response.error).toMatchObject({ message: "Id has to be a number", data: { code: "BAD_REQUEST" } });
    });
  });

  describe("when the request is interrupted", () => {
    it("should abort a running request", async () => {
      const request = client.createRequest<{ response: string }>()({ endpoint: "held" });

      const pending = request.send();
      await gate.started;
      request.abort();
      const response = await pending;

      expect(response.error).toStrictEqual(getErrorMessage("abort"));
      expect(response.status).toBe(0);
      expect(response.success).toBe(false);
    });

    it("should time out a running request", async () => {
      const response = await client
        .createRequest<{ response: string }>()({ endpoint: "held", options: { timeout: 20 } })
        .send();

      expect(response.error).toStrictEqual(getErrorMessage("timeout"));
      expect(response.status).toBe(0);
    });

    it("should finish a request once the server responds", async () => {
      const pending = client.createRequest<{ response: string }>()({ endpoint: "held" }).send();

      await gate.started;
      gate.release();

      const response = await pending;

      expect(response.data).toBe("released");
    });
  });

  describe("when using the transformer", () => {
    const date = new Date("2024-01-01T00:00:00.000Z");

    it("should round trip a query", async () => {
      const response = await transformerClient
        .createRequest<{ response: { date: Date; tags: Set<string> }; payload: { date: Date } }>()({
          endpoint: "nextDay",
        })
        .setPayload({ date })
        .send();

      expect(response.data?.date).toStrictEqual(new Date("2024-01-02T00:00:00.000Z"));
      expect(response.data?.tags).toStrictEqual(new Set(["a", "b"]));
    });

    it("should round trip a mutation", async () => {
      const response = await transformerClient
        .createRequest<{
          response: { isDate: boolean; total: bigint };
          payload: { date: Date; total: bigint };
        }>()({ endpoint: "save", method: "MUTATION" })
        .setPayload({ date, total: 21n })
        .send();

      expect(response.data).toStrictEqual({ isDate: true, total: 42n });
    });

    it("should map an undefined output to null", async () => {
      const response = await transformerClient.createRequest()({ endpoint: "nothing" }).send();

      expect(response.data).toBeNull();
      expect(response.success).toBe(true);
    });

    it("should deserialize the error", async () => {
      const response = await transformerClient
        .createRequest<{ response: never; error: TrpcErrorType }>()({ endpoint: "fail" })
        .send();

      expect(response.status).toBe(409);
      expect(response.error).toMatchObject({
        message: "Already exists",
        code: -32_009,
        data: { code: "CONFLICT", httpStatus: 409, path: "fail" },
      });
    });
  });

  describe("when using the SDK", () => {
    const createApi = () => createSdk<typeof client, TrpcSchema<AppRouter>>(client, { camelCaseToKebabCase: false });

    it("should call a top level query", async () => {
      const response = await createApi().health.$query.send();

      expect(response.data).toBe("ok");
      expect(appServer.requests[0].url).toBe("/health");
    });

    it("should call a nested query", async () => {
      const response = await createApi().user.byId.$query.setPayload({ id: 1 }).send();

      expect(response.data).toStrictEqual({ id: 1, name: "John" });
      expect(appServer.requests[0].url).toBe(`/user.byId?input=${encodeURIComponent('{"id":1}')}`);
    });

    it("should call a query with an optional input", async () => {
      const all = await createApi().user.list.$query.send();
      const limited = await createApi().user.list.$query.setPayload({ limit: 1 }).send();

      expect(all.data).toHaveLength(2);
      expect(limited.data).toStrictEqual([{ id: 1, name: "John" }]);
    });

    it("should call a nested mutation", async () => {
      const response = await createApi().user.create.$mutation.setPayload({ name: "Jack" }).send();

      expect(response.data).toStrictEqual({ id: 3, name: "Jack" });
      expect(appServer.requests[0].method).toBe("POST");
      expect(appServer.requests[0].url).toBe("/user.create");
    });

    it("should share the cache with a request created by hand", async () => {
      const sdkRequest = createApi().user.byId.$query.setPayload({ id: 1 });
      const manualRequest = client
        .createRequest<{ response: unknown; payload: { id: number } }>()({ endpoint: "user.byId" })
        .setPayload({ id: 1 });

      expect(sdkRequest.cacheKey).toBe(manualRequest.cacheKey);
    });

    it("should work with the transformer", async () => {
      const api = createSdk<typeof transformerClient, TrpcSchema<TransformerRouter>>(transformerClient, {
        camelCaseToKebabCase: false,
      });

      const response = await api.nextDay.$query.setPayload({ date: new Date("2024-01-01T00:00:00.000Z") }).send();

      expect(response.data?.date).toStrictEqual(new Date("2024-01-02T00:00:00.000Z"));
    });
  });
});

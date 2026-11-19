/**
 * @vitest-environment node
 */
import { createClient, createSdk, getErrorMessage } from "@hyper-fetch/core";

import type { OrpcSchema } from "../../src/adapter";
import { OrpcAdapter } from "../../src/adapter";
import type { AppRouter, Gate } from "./e2e.orpc-server";
import { createAppRouter, createE2EOrpcServer, createGate } from "./e2e.orpc-server";

describe("Orpc Adapter [ E2E ]", () => {
  let gate: Gate = createGate();
  const { startServer, stopServer, requests } = createE2EOrpcServer(createAppRouter(() => gate));

  let baseUrl = "";
  let client = createClient({ url: "" }).setAdapter(OrpcAdapter());

  const createApi = () => createSdk<typeof client, OrpcSchema<AppRouter>>(client, { camelCaseToKebabCase: false });

  beforeAll(async () => {
    baseUrl = `${await startServer()}/rpc`;
  });

  beforeEach(() => {
    gate = createGate();
    requests.length = 0;
    client = createClient({ url: baseUrl, mode: "client" }).setAdapter(OrpcAdapter());
  });

  afterEach(() => {
    gate.release();
    client.clear();
  });

  afterAll(async () => {
    await stopServer();
  });

  describe("when calling queries", () => {
    it("should call a query without an input", async () => {
      const response = await createApi().health.$query.send();

      expect(response.data).toBe("ok");
      expect(response.error).toBeNull();
      expect(response.status).toBe(200);
      expect(response.success).toBe(true);
      expect(requests).toStrictEqual([{ method: "POST", url: "/rpc/health", contentType: "application/json" }]);
    });

    it("should call a nested query with an input", async () => {
      const response = await createApi().user.byId.$query.setPayload({ id: 2 }).send();

      expect(response.data).toStrictEqual({ id: 2, name: "Jane" });
    });

    it.each([
      ["double", 21, 42],
      ["negate", true, false],
      ["shout", "hey", "HEY"],
    ] as const)("should call the %s query with a primitive input", async (endpoint, input, output) => {
      const response = await client.createRequest<{ response: unknown; payload: unknown }>()({ endpoint }).send({
        payload: input,
      });

      expect(response.data).toBe(output);
    });

    it("should keep the responses of different inputs in separate cache entries", async () => {
      const api = createApi();

      await api.user.byId.$query.setPayload({ id: 1 }).send();
      await api.user.byId.$query.setPayload({ id: 2 }).send();

      const first = client.cache.get(api.user.byId.$query.setPayload({ id: 1 }).cacheKey);
      const second = client.cache.get(api.user.byId.$query.setPayload({ id: 2 }).cacheKey);

      expect(first?.data).toStrictEqual({ id: 1, name: "John" });
      expect(second?.data).toStrictEqual({ id: 2, name: "Jane" });
    });

    it("should deduplicate only the calls with the same input", async () => {
      const api = createApi();

      const responses = await Promise.all([
        api.user.byId.$query.setPayload({ id: 1 }).send(),
        api.user.byId.$query.setPayload({ id: 1 }).send(),
        api.user.byId.$query.setPayload({ id: 2 }).send(),
      ]);

      expect(responses.map(({ data }) => data?.name)).toStrictEqual(["John", "John", "Jane"]);
      expect(requests).toHaveLength(2);
    });
  });

  describe("when calling mutations", () => {
    it("should call a mutation with an input", async () => {
      const response = await createApi().user.create.$mutation.setPayload({ name: "Jack" }).send();

      expect(response.data).toStrictEqual({ id: 3, name: "Jack" });
      expect(requests).toStrictEqual([{ method: "POST", url: "/rpc/user/create", contentType: "application/json" }]);
    });

    it("should call a mutation without an input and without an output", async () => {
      const response = await createApi().noop.$mutation.send();

      expect(response.data).toBeNull();
      expect(response.error).toBeNull();
      expect(response.success).toBe(true);
    });
  });

  describe("when using GET for the queries", () => {
    beforeEach(() => {
      client = createClient({ url: baseUrl, mode: "client" }).setAdapter(OrpcAdapter({ queryMethod: "GET" }));
    });

    it("should call a procedure that allows GET", async () => {
      const response = await createApi().user.byId.$query.setPayload({ id: 1 }).send();

      expect(response.data).toStrictEqual({ id: 1, name: "John" });
      expect(requests[0].method).toBe("GET");
    });

    it("should report a procedure that does not allow GET", async () => {
      const response = await createApi().health.$query.send();

      expect(response.error).toMatchObject({ code: "METHOD_NOT_SUPPORTED", status: 405, defined: false });
      expect(response.status).toBe(405);
    });

    it("should let a request switch back to POST", async () => {
      const response = await createApi().health.$query.setOptions({ queryMethod: "POST" }).send();

      expect(response.data).toBe("ok");
      expect(requests[0].method).toBe("POST");
    });

    it("should send mutations with POST", async () => {
      const response = await createApi().user.byId.$mutation.setPayload({ id: 1 }).send();

      expect(response.data).toStrictEqual({ id: 1, name: "John" });
      expect(requests[0].method).toBe("POST");
    });
  });

  describe("when the procedure fails", () => {
    it("should return a defined error with its data", async () => {
      const response = await createApi().user.byId.$query.setPayload({ id: 99 }).send();

      expect(response.data).toBeNull();
      expect(response.error).toStrictEqual({
        defined: true,
        code: "NOT_FOUND",
        status: 404,
        message: "User not found",
        data: { id: 99 },
      });
      expect(response.status).toBe(404);
      expect(response.success).toBe(false);
    });

    it.each([
      ["BAD_REQUEST", 400],
      ["UNAUTHORIZED", 401],
      ["FORBIDDEN", 403],
      ["CONFLICT", 409],
      ["TOO_MANY_REQUESTS", 429],
      ["NOT_IMPLEMENTED", 501],
    ])("should map the %s error", async (code, status) => {
      const response = await createApi().fail.$query.setPayload({ code }).send();

      expect(response.error).toStrictEqual({
        defined: false,
        code,
        status,
        message: `Failed with ${code}`,
        data: undefined,
      });
      expect(response.status).toBe(status);
    });

    it("should map a custom error code with a custom status", async () => {
      const response = await createApi().fail.$query.setPayload({ code: "OUT_OF_STOCK", status: 418 }).send();

      expect(response.error).toMatchObject({ code: "OUT_OF_STOCK", status: 418 });
      expect(response.status).toBe(418);
    });

    it("should map an unexpected server error", async () => {
      const response = await createApi().crash.$query.send();

      expect(response.error).toMatchObject({ code: "INTERNAL_SERVER_ERROR", status: 500, defined: false });
    });

    it("should map a failed input validation", async () => {
      const response = await client
        .createRequest<{ response: number; payload: string }>()({ endpoint: "double" })
        .setPayload("not a number")
        .send();

      expect(response.error).toMatchObject({ code: "BAD_REQUEST", status: 400, message: "Input validation failed" });
    });

    it("should map a failed output validation", async () => {
      const response = await createApi().badOutput.$query.send();

      expect(response.error).toMatchObject({ code: "INTERNAL_SERVER_ERROR", status: 500 });
    });

    it("should report an unknown procedure", async () => {
      const response = await client.createRequest()({ endpoint: "missing" }).send();

      expect(response.error).toStrictEqual(getErrorMessage());
      expect(response.status).toBe(404);
    });
  });

  describe("when the request is interrupted", () => {
    it("should abort a running request", async () => {
      const request = createApi().held.$query;
      const pending = request.send();

      await gate.started;
      request.abort();
      const response = await pending;

      expect(response.error).toStrictEqual(getErrorMessage("abort"));
      expect(response.status).toBe(0);
    });

    it("should time out a running request", async () => {
      const response = await createApi().held.$query.setOptions({ timeout: 20 }).send();

      expect(response.error).toStrictEqual(getErrorMessage("timeout"));
    });

    it("should finish a request once the server responds", async () => {
      const pending = createApi().held.$query.send();

      await gate.started;
      gate.release();
      const response = await pending;

      expect(response.data).toBe("released");
    });
  });

  describe("when serializing the special types", () => {
    const date = new Date("2024-01-01T00:00:00.000Z");

    it.each(["$query", "$mutation"] as const)("should round trip the types with %s", async (method) => {
      const response = await createApi().types.nextDay[method].setPayload({ date, total: 21n }).send();

      expect(response.error).toBeNull();
      expect(response.data).toStrictEqual({
        date: new Date("2024-01-02T00:00:00.000Z"),
        total: 42n,
        tags: new Set(["a", "b"]),
        scores: new Map([["a", 1]]),
        sparse: [1, undefined],
        site: new URL("https://orpc.dev/docs"),
        notANumber: Number.NaN,
        pattern: /orpc/gi,
      });
    });

    it("should round trip the types with GET", async () => {
      // The procedure does not declare GET, so the server has to accept GET for every procedure
      const server = createE2EOrpcServer(createAppRouter(), {
        handlerOptions: { strictGetMethodPluginEnabled: false },
      });
      client = createClient({ url: `${await server.startServer()}/rpc` }).setAdapter(
        OrpcAdapter({ queryMethod: "GET" }),
      );

      try {
        const response = await createApi().types.nextDay.$query.setPayload({ date, total: 1n }).send();

        expect(response.data?.total).toBe(2n);
        expect(response.data?.date).toStrictEqual(new Date("2024-01-02T00:00:00.000Z"));
        expect(server.requests[0].method).toBe("GET");
      } finally {
        await server.stopServer();
      }
    });

    it("should upload a file", async () => {
      const file = new File(["file content"], "notes.txt", { type: "text/plain" });

      const response = await createApi().types.upload.$mutation.setPayload({ name: "Notes", file }).send();

      expect(response.data).toStrictEqual({ name: "Notes", fileName: "notes.txt", size: 12, text: "file content" });
      expect(requests[0].contentType).toStartWith("multipart/form-data; boundary=");
    });

    it("should download a file", async () => {
      const response = await createApi().types.download.$query.send();

      expect(response.error).toBeNull();
      expect(response.data?.createdAt).toStrictEqual(date);
      expect(response.data?.file).toBeInstanceOf(Blob);
      expect(await response.data?.file.text()).toBe("hello");
    });
  });

  describe("when using the headers", () => {
    it("should pass the token from onAuth", async () => {
      client.onAuth((request) => request.setHeaders({ authorization: "Bearer token" }));

      const response = await createApi().me.$query.setAuth(true).send();

      expect(response.data).toBe("admin");
    });

    it("should reject a request without the token", async () => {
      const response = await createApi().me.$query.send();

      expect(response.error).toMatchObject({ code: "UNAUTHORIZED", status: 401, message: "Missing token" });
    });
  });

  describe("when the server is mounted on a different path", () => {
    it("should keep the client url path and query string", async () => {
      const server = createE2EOrpcServer(createAppRouter(), { prefix: "/api/v1/rpc" });
      const url = await server.startServer();
      client = createClient({ url: `${url}/api/v1/rpc/?version=2` }).setAdapter(OrpcAdapter());

      try {
        const response = await createApi().user.byId.$query.setPayload({ id: 1 }).send();

        expect(response.data).toStrictEqual({ id: 1, name: "John" });
        expect(server.requests[0].url).toBe("/api/v1/rpc/user/byId?version=2");
      } finally {
        await server.stopServer();
      }
    });
  });
});

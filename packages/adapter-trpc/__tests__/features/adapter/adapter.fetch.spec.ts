/**
 * @vitest-environment node
 */
import { createClient, getErrorMessage, getRequestDispatcher } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { delay, http, HttpResponse } from "msw";
import { deserialize, serialize } from "superjson";

import { TrpcAdapter } from "../../../src/adapter";

const { server, startServer, stopServer, resetMocks, mockRequest } = createHttpMockingServer();

const superjson = { serialize, deserialize };

const url = "http://localhost:3000/trpc";

type User = { id: number; name: string };

const trpcError = {
  message: "User not found",
  code: -32_004,
  data: { code: "NOT_FOUND", httpStatus: 404, path: "user.byId" },
};

describe("Trpc Adapter [ Fetch ]", () => {
  let client = createClient({ url }).setAdapter(TrpcAdapter());

  const createQuery = () =>
    client.createRequest<{ response: User; payload: { id: number } }>()({ endpoint: "user.byId", method: "QUERY" });
  const createMutation = () =>
    client.createRequest<{ response: User; payload: { name: string } }>()({
      endpoint: "user.create",
      method: "MUTATION",
    });

  /** Captures the request that reached the network */
  const captureRequest = (method: "get" | "post", procedure: string, body?: unknown) => {
    const captured: { current: Request | null; body: string } = { current: null, body: "" };

    server.use(
      http[method](`${url}/${procedure}`, async ({ request }) => {
        captured.current = request.clone();
        captured.body = await request.text();
        return HttpResponse.json((body ?? { result: { data: null } }) as Record<string, unknown>);
      }),
    );

    return captured;
  };

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = createClient({ url }).setAdapter(TrpcAdapter());
  });

  afterEach(() => {
    resetMocks();
    client.clear();
  });

  afterAll(() => {
    stopServer();
  });

  describe("when sending a query", () => {
    it("should use QUERY as the default method", () => {
      expect(client.createRequest()({ endpoint: "health" }).method).toBe("QUERY");
    });

    it("should use the fetch dispatcher and deduplicate by default", () => {
      const request = createQuery();

      expect(getRequestDispatcher(request)[1]).toBe(true);
      expect(request.deduplicate).toBe(true);
    });

    it("should send a GET request with the encoded input", async () => {
      const captured = captureRequest("get", "user.byId");

      await createQuery().setPayload({ id: 1 }).send();

      const input = encodeURIComponent(JSON.stringify({ id: 1 }));
      expect(captured.current?.method).toBe("GET");
      expect(captured.current?.url).toBe(`${url}/user.byId?input=${input}`);
      expect(captured.current?.headers.get("content-type")).toBeNull();
    });

    it("should not send the input param when there is no input", async () => {
      const captured = captureRequest("get", "health");

      await client.createRequest()({ endpoint: "health" }).send();

      expect(captured.current?.url).toBe(`${url}/health`);
    });

    it("should map the result to the response", async () => {
      const user = { id: 1, name: "John" };
      mockRequest(createQuery(), { data: { result: { data: user } } as unknown as User });

      const response = await createQuery().setPayload({ id: 1 }).send();

      expect(response.data).toStrictEqual(user);
      expect(response.error).toBeNull();
      expect(response.status).toBe(200);
      expect(response.success).toBe(true);
      expect(response.extra?.headers["content-type"]).toContain("application/json");
    });

    it("should send the query params next to the input", async () => {
      const captured = captureRequest("get", "user.list");

      await client
        .createRequest<{ response: User[]; payload: { page: number }; queryParams: { source: string } }>()({
          endpoint: "user.list",
        })
        .setPayload({ page: 2 })
        .setQueryParams({ source: "app" })
        .send();

      const input = encodeURIComponent(JSON.stringify({ page: 2 }));
      expect(captured.current?.url).toBe(`${url}/user.list?source=app&input=${input}`);
    });

    it("should apply the request payload mapper before encoding", async () => {
      const captured = captureRequest("get", "user.byId");

      await createQuery()
        .setPayload({ id: 1 })
        .setPayloadMapper((payload) => ({ id: (payload?.id ?? 0) + 1 }))
        .send();

      expect(new URL(captured.current?.url as string).searchParams.get("input")).toBe('{"id":2}');
    });
  });

  describe("when sending a mutation", () => {
    it("should use the submit dispatcher and not deduplicate by default", () => {
      const request = createMutation();

      expect(getRequestDispatcher(request)[1]).toBe(false);
      expect(request.deduplicate).toBe(false);
    });

    it("should send a POST request with a JSON body", async () => {
      const captured = captureRequest("post", "user.create");

      await createMutation().setPayload({ name: "John" }).send();

      expect(captured.current?.method).toBe("POST");
      expect(captured.current?.url).toBe(`${url}/user.create`);
      expect(captured.current?.headers.get("content-type")).toBe("application/json");
      expect(captured.body).toBe('{"name":"John"}');
    });

    it("should send the content type without an input", async () => {
      const captured = captureRequest("post", "user.reset");

      await client.createRequest()({ endpoint: "user.reset", method: "MUTATION" }).send();

      expect(captured.current?.headers.get("content-type")).toBe("application/json");
      expect(captured.body).toBe("");
    });

    it("should map the result to the response", async () => {
      const user = { id: 2, name: "Jane" };
      captureRequest("post", "user.create", { result: { data: user } });

      const response = await createMutation().setPayload({ name: "Jane" }).send();

      expect(response.data).toStrictEqual(user);
      expect(response.success).toBe(true);
    });

    it("should report the upload progress", async () => {
      captureRequest("post", "user.create");
      const onUploadProgress = vi.fn();

      await createMutation().setPayload({ name: "John" }).send({ onUploadProgress });

      expect(onUploadProgress).toHaveBeenCalled();
    });
  });

  describe("when the request fails", () => {
    it("should map the error envelope", async () => {
      server.use(http.get(`${url}/user.byId`, () => HttpResponse.json({ error: trpcError }, { status: 404 })));

      const response = await createQuery().setPayload({ id: 1 }).send();

      expect(response.data).toBeNull();
      expect(response.error).toStrictEqual(trpcError);
      expect(response.status).toBe(404);
      expect(response.success).toBe(false);
      expect(response.extra?.headers["content-type"]).toContain("application/json");
    });

    it("should treat the error envelope as a failure regardless of the status", async () => {
      server.use(http.get(`${url}/user.byId`, () => HttpResponse.json({ error: trpcError })));

      const response = await createQuery().setPayload({ id: 1 }).send();

      expect(response.error).toStrictEqual(trpcError);
      expect(response.status).toBe(200);
      expect(response.success).toBe(false);
    });

    it("should fail for a response that did not come from a procedure", async () => {
      server.use(
        http.get(`${url}/user.byId`, () => {
          return new HttpResponse("<html>Bad gateway</html>", {
            status: 502,
            headers: { "content-type": "text/html" },
          });
        }),
      );

      const response = await createQuery().setPayload({ id: 1 }).send();

      expect(response.data).toBeNull();
      expect(response.error).toStrictEqual(getErrorMessage());
      expect(response.status).toBe(502);
      expect(response.extra?.headers["content-type"]).toBe("text/html");
    });

    it("should handle a network error", async () => {
      server.use(http.get(`${url}/user.byId`, () => HttpResponse.error()));

      const response = await createQuery().setPayload({ id: 1 }).send();

      expect(response.error).toBeInstanceOf(Error);
      expect(response.status).toBe(0);
      expect(response.extra).toStrictEqual({ headers: {} });
    });

    it("should report an input that can't be serialized", async () => {
      const request = client.createRequest<{ response: User; payload: { id: bigint } }>()({ endpoint: "user.byId" });

      const response = await request.setPayload({ id: 1n }).send();

      expect(response.error).toBeInstanceOf(TypeError);
      expect(response.status).toBe(0);
    });

    it("should time out", async () => {
      server.use(
        http.get(`${url}/user.byId`, async () => {
          await delay("infinite");
          return HttpResponse.json({ result: { data: null } });
        }),
      );

      const response = await createQuery().setPayload({ id: 1 }).setOptions({ timeout: 10 }).send();

      expect(response.error).toStrictEqual(getErrorMessage("timeout"));
      expect(response.status).toBe(0);
    });

    it("should abort", async () => {
      server.use(
        http.get(`${url}/user.byId`, async () => {
          await delay("infinite");
          return HttpResponse.json({ result: { data: null } });
        }),
      );

      const request = createQuery().setPayload({ id: 1 });
      const pending = request.send({ onRequestStart: () => request.abort() });
      const response = await pending;

      expect(response.error).toStrictEqual(getErrorMessage("abort"));
      expect(response.status).toBe(0);
    });
  });

  describe("when using the transformer", () => {
    const date = new Date("2024-01-01T00:00:00.000Z");

    beforeEach(() => {
      client = createClient({ url }).setAdapter(TrpcAdapter({ transformer: superjson }));
    });

    it("should serialize the query input", async () => {
      const captured = captureRequest("get", "user.byId", { result: { data: superjson.serialize(null) } });

      await client
        .createRequest<{ response: User; payload: { date: Date } }>()({ endpoint: "user.byId" })
        .setPayload({ date })
        .send();

      const input = new URL(captured.current?.url as string).searchParams.get("input");
      expect(JSON.parse(input as string)).toStrictEqual(superjson.serialize({ date }));
    });

    it("should serialize the mutation input", async () => {
      const captured = captureRequest("post", "user.create", { result: { data: superjson.serialize(null) } });

      await client
        .createRequest<{ response: User; payload: { date: Date } }>()({ endpoint: "user.create", method: "MUTATION" })
        .setPayload({ date })
        .send();

      expect(JSON.parse(captured.body)).toStrictEqual(superjson.serialize({ date }));
    });

    it("should deserialize the data", async () => {
      captureRequest("get", "user.byId", { result: { data: superjson.serialize({ date }) } });

      const response = await client.createRequest<{ response: { date: Date } }>()({ endpoint: "user.byId" }).send();

      expect(response.data).toStrictEqual({ date });
    });

    it("should deserialize the error", async () => {
      server.use(
        http.get(`${url}/user.byId`, () => {
          return HttpResponse.json({ error: superjson.serialize(trpcError) }, { status: 404 });
        }),
      );

      const response = await client.createRequest()({ endpoint: "user.byId" }).send();

      expect(response.error).toStrictEqual(trpcError);
      expect(response.status).toBe(404);
    });

    it("should report a transformer failure with the response status", async () => {
      client = createClient({ url }).setAdapter(
        TrpcAdapter({
          transformer: {
            serialize: (value) => value,
            deserialize: () => {
              throw new Error("Cannot deserialize");
            },
          },
        }),
      );
      captureRequest("get", "user.byId", { result: { data: 1 } });

      const response = await client.createRequest()({ endpoint: "user.byId" }).send();

      expect(response.error).toStrictEqual(new Error("Cannot deserialize"));
      expect(response.status).toBe(200);
      expect(response.success).toBe(false);
    });
  });
});

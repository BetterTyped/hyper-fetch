/**
 * @vitest-environment node
 */
import type { RequestInstance } from "@hyper-fetch/core";
import { createClient, getErrorMessage } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { delay, http, HttpResponse } from "msw";

import { OrpcAdapter, OrpcMethods, orpcExtra } from "../../../src/adapter";

const { server, startServer, stopServer, resetMocks } = createHttpMockingServer();

const url = "http://localhost:3000/rpc";

type User = { id: number; name: string };

const orpcError = { defined: false, code: "INTERNAL_SERVER_ERROR", status: 500, message: "Nope", data: undefined };

/** The input part of the serialized body */
const readInput = async (request: Request) =>
  JSON.stringify(((await request.clone().json()) as { json: unknown }).json);

describe("Orpc Adapter [ Lifecycle ]", () => {
  let client = createClient({ url, mode: "client" }).setAdapter(OrpcAdapter());

  const createQuery = () =>
    client.createRequest<{ response: User; payload: { id: number } }>()({ endpoint: "user/byId" });
  const createMutation = () =>
    client.createRequest<{ response: User; payload: { name: string } }>()({
      endpoint: "user/create",
      method: "MUTATION",
    });

  const respondWith = (data: unknown, procedure = "user/byId") => {
    const calls: Request[] = [];
    server.use(
      http.post(`${url}/${procedure}`, ({ request }) => {
        calls.push(request);
        return HttpResponse.json({ json: data });
      }),
    );
    return calls;
  };

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = createClient({ url, mode: "client" }).setAdapter(OrpcAdapter());
  });

  afterEach(() => {
    resetMocks();
    client.clear();
  });

  afterAll(() => {
    stopServer();
  });

  describe("when creating the adapter", () => {
    it("should expose the adapter defaults", () => {
      const adapter = OrpcAdapter();

      expect(adapter.name).toBe("orpc");
      expect(adapter.defaultMethod).toBe(OrpcMethods.QUERY);
      expect(adapter.defaultExtra).toStrictEqual(orpcExtra);
      expect(adapter.systemErrorStatus).toBe(0);
      expect(adapter.systemErrorExtra).toStrictEqual(orpcExtra);
    });

    it("should create independent adapters", () => {
      expect(OrpcAdapter()).not.toBe(OrpcAdapter());
    });

    it("should map the endpoint for the devtools", () => {
      expect(OrpcAdapter().unstable_devtoolsEndpointGetter("user/byId")).toBe("/user/byId");
    });
  });

  describe("when using the interceptors", () => {
    it("should send the headers added in onRequest", async () => {
      const calls = respondWith({ id: 1, name: "John" });
      client.onRequest((request) => request.setHeaders({ "x-tenant": "acme" }));

      await createQuery().setPayload({ id: 1 }).send();

      expect(calls[0].headers.get("x-tenant")).toBe("acme");
    });

    it("should send the headers added in onAuth", async () => {
      const calls = respondWith({ id: 1, name: "John" });
      client.onAuth((request) => request.setHeaders({ Authorization: "Bearer token" }));

      await createQuery().setPayload({ id: 1 }).send();

      expect(calls[0].headers.get("authorization")).toBe("Bearer token");
    });

    it("should skip onAuth for public requests", async () => {
      const calls = respondWith({ id: 1, name: "John" });
      client.onAuth((request) => request.setHeaders({ Authorization: "Bearer token" }));

      await createQuery().setAuth(false).setPayload({ id: 1 }).send();

      expect(calls[0].headers.get("authorization")).toBeNull();
    });

    it("should encode the input changed by the request mapper", async () => {
      const calls = respondWith({ id: 2, name: "Jane" });

      await createQuery()
        .setPayload({ id: 1 })
        .setRequestMapper((request) => request.setPayload({ id: 2 }))
        .send();

      expect(await readInput(calls[0])).toBe('{"id":2}');
    });

    it("should pass the mapped response to onSuccess", async () => {
      respondWith({ id: 1, name: "John" });
      const onSuccess = vi.fn((response) => response);
      client.onSuccess(onSuccess);

      await createQuery().setPayload({ id: 1 }).send();

      expect(onSuccess.mock.calls[0][0]).toMatchObject({ data: { id: 1, name: "John" }, status: 200, success: true });
    });

    it("should pass the mapped error to onError", async () => {
      server.use(http.post(`${url}/user/byId`, () => HttpResponse.json({ json: orpcError }, { status: 500 })));
      const onError = vi.fn((response) => response);
      client.onError(onError);

      await createQuery().setPayload({ id: 1 }).send();

      expect(onError.mock.calls[0][0]).toMatchObject({ error: orpcError, status: 500, success: false });
    });

    it("should let the response mapper change the result", async () => {
      respondWith({ id: 1, name: "John" });

      const response = await createQuery()
        .setPayload({ id: 1 })
        .setResponseMapper((res) => ({ ...res, data: { ...res.data, name: "Mapped" } }) as typeof res)
        .send();

      expect(response.data).toStrictEqual({ id: 1, name: "Mapped" });
    });
  });

  describe("when following the request events", () => {
    it("should trigger the events in order", async () => {
      respondWith({ id: 1, name: "John" });
      const events: string[] = [];

      await createQuery()
        .setPayload({ id: 1 })
        .send({
          onBeforeSent: () => events.push("beforeSent"),
          onRequestStart: () => events.push("requestStart"),
          onResponseStart: () => events.push("responseStart"),
          onResponse: () => events.push("response"),
        });

      expect(events).toStrictEqual(["beforeSent", "requestStart", "responseStart", "response"]);
    });

    it("should report the upload progress with the size of the mutation body", async () => {
      server.use(http.post(`${url}/user/create`, () => HttpResponse.json({ json: null })));
      const onUploadProgress = vi.fn();
      const payload = { name: "zażółć 🎡" };
      const size = new Blob([JSON.stringify({ json: payload })]).size;

      await createMutation().setPayload(payload).send({ onUploadProgress });

      expect(onUploadProgress).toHaveBeenCalledWith(expect.objectContaining({ loaded: size, total: size }));
    });
  });

  describe("when retrying", () => {
    it("should retry a failed query until it succeeds", async () => {
      let attempts = 0;
      server.use(
        http.post(`${url}/user/byId`, () => {
          attempts += 1;
          return attempts < 3
            ? HttpResponse.json({ json: orpcError }, { status: 500 })
            : HttpResponse.json({ json: { id: 1, name: "John" } });
        }),
      );

      const response = await createQuery().setPayload({ id: 1 }).setRetry(2).setRetryTime(1).send();

      expect(attempts).toBe(3);
      expect(response.data).toStrictEqual({ id: 1, name: "John" });
    });

    it("should send the same input with every attempt", async () => {
      const inputs: (string | null)[] = [];
      server.use(
        http.post(`${url}/user/byId`, async ({ request }) => {
          inputs.push(await readInput(request));
          return HttpResponse.json({ json: orpcError }, { status: 500 });
        }),
      );

      await createQuery().setPayload({ id: 7 }).setRetry(2).setRetryTime(1).send();

      expect(inputs).toStrictEqual(['{"id":7}', '{"id":7}', '{"id":7}']);
    });

    it("should retry a failed mutation with the same body", async () => {
      const bodies: string[] = [];
      server.use(
        http.post(`${url}/user/create`, async ({ request }) => {
          bodies.push(await request.text());
          return bodies.length < 2
            ? HttpResponse.json({ json: orpcError }, { status: 500 })
            : HttpResponse.json({ json: { id: 3, name: "Jack" } });
        }),
      );

      const response = await createMutation().setPayload({ name: "Jack" }).setRetry(1).setRetryTime(1).send();

      expect(bodies).toStrictEqual(['{"json":{"name":"Jack"}}', '{"json":{"name":"Jack"}}']);
      expect(response.data).toStrictEqual({ id: 3, name: "Jack" });
    });

    it("should stop retrying based on the oRPC error", async () => {
      let attempts = 0;
      const notFound = { defined: true, code: "NOT_FOUND", status: 404, message: "Nope", data: undefined };
      server.use(
        http.post(`${url}/user/byId`, () => {
          attempts += 1;
          return HttpResponse.json({ json: notFound }, { status: 404 });
        }),
      );

      const response = await createQuery()
        .setPayload({ id: 1 })
        .setRetry(5)
        .setRetryTime(1)
        .setRetryOnError(({ error }) => (error as typeof notFound | null)?.code !== "NOT_FOUND")
        .send();

      expect(attempts).toBe(1);
      expect(response.status).toBe(404);
    });
  });

  describe("when requests run at the same time", () => {
    it("should cancel the running call with the same input", async () => {
      let calls = 0;
      server.use(
        http.post(`${url}/user/byId`, async () => {
          calls += 1;
          if (calls === 1) {
            await delay("infinite");
          }
          return HttpResponse.json({ json: { id: 1, name: "John" } });
        }),
      );
      const request = createQuery().setCancelable(true).setDeduplicate(false).setPayload({ id: 1 });

      const pending = request.send();
      await vi.waitFor(() => expect(calls).toBe(1));
      const second = await request.send();
      const first = await pending;

      expect(first.error).toStrictEqual(getErrorMessage("abort"));
      expect(second.data).toStrictEqual({ id: 1, name: "John" });
    });

    it("should keep the running calls with a different input", async () => {
      respondWith({ id: 1, name: "John" });
      const request = createQuery().setCancelable(true);

      const [first, second] = await Promise.all([
        request.setPayload({ id: 1 }).send(),
        request.setPayload({ id: 2 }).send(),
      ]);

      expect(first.success).toBe(true);
      expect(second.success).toBe(true);
    });

    it("should cancel a different input when the calls share the query key", async () => {
      server.use(
        http.post(`${url}/user/byId`, async ({ request }) => {
          if ((await readInput(request)) === '{"id":1}') {
            await delay("infinite");
          }
          return HttpResponse.json({ json: { id: 2, name: "Jane" } });
        }),
      );
      const request = createQuery().setCancelable(true).setDeduplicate(false).setQueryKey("user-search");

      const [first, second] = await Promise.all([
        request.setPayload({ id: 1 }).send(),
        request.setPayload({ id: 2 }).send(),
      ]);

      expect(first.error).toStrictEqual(getErrorMessage("abort"));
      expect(second.data).toStrictEqual({ id: 2, name: "Jane" });
    });

    it("should abort every running call of the procedure", async () => {
      const started: (string | null)[] = [];
      server.use(
        http.post(`${url}/user/byId`, async ({ request }) => {
          started.push(await readInput(request));
          await delay("infinite");
          return HttpResponse.json({ json: null });
        }),
      );
      const request = createQuery();

      const pending = Promise.all([request.setPayload({ id: 1 }).send(), request.setPayload({ id: 2 }).send()]);
      await vi.waitFor(() => expect(started).toHaveLength(2));
      request.abort();
      const responses = await pending;

      expect(responses.map(({ error }) => error)).toStrictEqual([getErrorMessage("abort"), getErrorMessage("abort")]);
    });

    it("should not cancel a different procedure", async () => {
      respondWith({ id: 1, name: "John" });
      respondWith([{ id: 1, name: "John" }], "user/list");

      const [byId, list] = await Promise.all([
        createQuery().setCancelable(true).setPayload({ id: 1 }).send(),
        client.createRequest<{ response: User[] }>()({ endpoint: "user/list", cancelable: true }).send(),
      ]);

      expect(byId.success).toBe(true);
      expect(list.success).toBe(true);
    });

    it("should send every call when deduplication is turned off", async () => {
      const calls = respondWith({ id: 1, name: "John" });
      const request = createQuery().setDeduplicate(false).setPayload({ id: 1 });

      await Promise.all([request.send(), request.send()]);

      expect(calls).toHaveLength(2);
    });

    it("should not deduplicate mutations", async () => {
      let calls = 0;
      server.use(
        http.post(`${url}/user/create`, () => {
          calls += 1;
          return HttpResponse.json({ json: { id: calls, name: "Jack" } });
        }),
      );
      const request = createMutation().setPayload({ name: "Jack" });

      await Promise.all([request.send(), request.send()]);

      expect(calls).toBe(2);
    });

    it("should run queued mutations one by one", async () => {
      let running = 0;
      let maxRunning = 0;
      const order: string[] = [];
      server.use(
        http.post(`${url}/user/create`, async ({ request }) => {
          running += 1;
          maxRunning = Math.max(maxRunning, running);
          const { name } = ((await request.json()) as { json: { name: string } }).json;
          order.push(name);
          await delay(1);
          running -= 1;
          return HttpResponse.json({ json: { id: 1, name } });
        }),
      );
      const request = createMutation().setQueued(true).setQueryKey("create-users");

      await Promise.all([
        request.setPayload({ name: "first" }).send(),
        request.setPayload({ name: "second" }).send(),
        request.setPayload({ name: "third" }).send(),
      ]);

      expect(maxRunning).toBe(1);
      expect(order).toStrictEqual(["first", "second", "third"]);
    });

    it("should run queued calls with different inputs independently", async () => {
      const started: (string | null)[] = [];
      let release = () => {};
      const released = new Promise<void>((resolve) => {
        release = resolve;
      });
      server.use(
        http.post(`${url}/user/byId`, async ({ request }) => {
          started.push(await readInput(request));
          await released;
          return HttpResponse.json({ json: { id: 1, name: "John" } });
        }),
      );
      const request = createQuery().setQueued(true);

      const pending = Promise.all([request.setPayload({ id: 1 }).send(), request.setPayload({ id: 2 }).send()]);
      await vi.waitFor(() => expect(started).toHaveLength(2));
      release();
      await pending;

      expect(started).toIncludeSameMembers(['{"id":1}', '{"id":2}']);
    });
  });

  describe("when using the cache", () => {
    it("should store the data with the extra", async () => {
      respondWith({ id: 1, name: "John" });
      const request = createQuery().setPayload({ id: 1 });

      await request.send();

      expect(client.cache.get(request.cacheKey)).toMatchObject({
        data: { id: 1, name: "John" },
        status: 200,
        success: true,
      });
    });

    it("should not store the failed responses", async () => {
      server.use(http.post(`${url}/user/byId`, () => HttpResponse.json({ json: orpcError }, { status: 500 })));
      const request = createQuery().setPayload({ id: 1 });

      await request.send();

      expect(client.cache.get(request.cacheKey)).toBeUndefined();
    });

    it("should not store the response when the cache is turned off", async () => {
      respondWith({ id: 1, name: "John" });
      const request = createQuery().setCache(false).setPayload({ id: 1 });

      await request.send();

      expect(client.cache.get(request.cacheKey)).toBeUndefined();
    });

    it("should change the keys together with the input", () => {
      const request = createQuery();
      const withInput = request.setPayload({ id: 1 });

      expect(withInput.cacheKey).not.toBe(request.cacheKey);
      expect(withInput.setPayload({ id: 1 }).cacheKey).toBe(withInput.cacheKey);
    });

    it("should keep custom keys", () => {
      const request = createQuery().setCacheKey("custom-cache").setQueryKey("custom-query").setAbortKey("custom-abort");
      const withInput = request.setPayload({ id: 1 });

      expect(withInput.cacheKey).toBe("custom-cache");
      expect(withInput.queryKey).toBe("custom-query");
      expect(withInput.abortKey).toBe("custom-abort");
    });

    it("should use separate abort keys for cancelable requests", () => {
      expect(createQuery().setCancelable(true).abortKey).not.toBe(createQuery().abortKey);
    });

    it("should isolate the scopes", async () => {
      respondWith({ id: 1, name: "John" });
      const first = createQuery().setPayload({ id: 1 }).setScope("first");
      const second = createQuery().setPayload({ id: 1 }).setScope("second");

      await first.send();

      expect(client.cache.get(`first__${first.cacheKey}`)).toMatchObject({ data: { id: 1, name: "John" } });
      expect(client.cache.get(`second__${second.cacheKey}`)).toBeUndefined();
    });
  });

  describe("when restoring the requests", () => {
    it("should recreate a query from JSON", async () => {
      const calls = respondWith({ id: 1, name: "John" });
      const request = createQuery().setPayload({ id: 1 });

      const restored = client.fromJSON<{ response: User; payload: { id: number } }>(request.toJSON());
      const response = await (restored as RequestInstance).send();

      expect(restored.method).toBe("QUERY");
      expect(restored.cacheKey).toBe(request.cacheKey);
      expect(restored.queryKey).toBe(request.queryKey);
      expect(restored.abortKey).toBe(request.abortKey);
      expect(await readInput(calls[0])).toBe('{"id":1}');
      expect(response.data).toStrictEqual({ id: 1, name: "John" });
    });

    it("should recreate a mutation from JSON", async () => {
      let body = "";
      server.use(
        http.post(`${url}/user/create`, async ({ request }) => {
          body = await request.text();
          return HttpResponse.json({ json: { id: 3, name: "Jack" } });
        }),
      );
      const request = createMutation().setPayload({ name: "Jack" });

      const restored = client.fromJSON<{ response: User; payload: { name: string } }>(request.toJSON());
      await (restored as RequestInstance).send();

      expect(restored.method).toBe("MUTATION");
      expect(body).toBe('{"json":{"name":"Jack"}}');
    });
  });

  describe("when mocking the requests", () => {
    it("should skip the network", async () => {
      const spy = vi.spyOn(globalThis, "fetch");

      const response = await createQuery()
        .setPayload({ id: 1 })
        .setMock(() => ({ data: { id: 9, name: "Mock" }, status: 200 }))
        .send();

      expect(response.data).toStrictEqual({ id: 9, name: "Mock" });
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});

import { Client, getErrorMessage, Plugin, scopeKey } from "@hyper-fetch/core";
import http from "http";
import type { AddressInfo } from "net";

import { AxiosAdapter } from "../../../src/adapter/adapter";

type ExchangeType = {
  req: http.IncomingMessage;
  res: http.ServerResponse;
  body: string;
  /** Resolves when the client side of the connection is closed */
  closed: Promise<void>;
};

/** A real HTTP server that answers only when the test tells it to. */
const createGatedServer = () => {
  const pending: ExchangeType[] = [];
  const waiters: ((exchange: ExchangeType) => void)[] = [];
  const server = http.createServer((req, res) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk: string) => {
      body += chunk;
    });
    req.on("end", () => {
      const closed = new Promise<void>((resolve) => {
        res.on("close", () => resolve());
      });
      const exchange: ExchangeType = { req, res, body, closed };
      const waiter = waiters.shift();
      if (waiter) {
        waiter(exchange);
      } else {
        pending.push(exchange);
      }
    });
  });

  return {
    start: () =>
      new Promise<string>((resolve) => {
        server.listen(0, "127.0.0.1", () => {
          resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
        });
      }),
    stop: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
    /** The next request that reached the server */
    next: () =>
      new Promise<ExchangeType>((resolve) => {
        const exchange = pending.shift();
        if (exchange) {
          resolve(exchange);
        } else {
          waiters.push(resolve);
        }
      }),
    reset: () => {
      pending.length = 0;
      waiters.length = 0;
    },
  };
};

const write = (res: http.ServerResponse, chunk: string) =>
  new Promise<void>((resolve) => {
    res.write(chunk, () => resolve());
  });

const json = (res: http.ServerResponse, status: number, data: unknown) => {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
    "X-Trace": "abc",
  });
  res.end(body);
};

describe("Axios Adapter [ Lifecycle ]", () => {
  const server = createGatedServer();
  let baseUrl = "";

  const createSetup = () => {
    const onRequestError = vi.fn();
    const onRequestSuccess = vi.fn();
    const onRequestFinished = vi.fn();
    const plugin = new Plugin({ name: "outcomes" })
      .onRequestError(onRequestError)
      .onRequestSuccess(onRequestSuccess)
      .onRequestFinished(onRequestFinished);
    const client = new Client({ url: baseUrl }).setAdapter(AxiosAdapter).addPlugin(plugin);
    return { client, onRequestError, onRequestSuccess, onRequestFinished };
  };

  beforeAll(async () => {
    baseUrl = await server.start();
  });

  afterEach(() => {
    server.reset();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe("when the request is aborted", () => {
    it("should resolve with the abort error and close the connection", async () => {
      const { client, onRequestError, onRequestFinished } = createSetup();
      const request = client.createRequest<{ response: { ok: boolean } }>()({ endpoint: "/abort" });

      const sent = request.send();
      const exchange = await server.next();
      request.abort();
      const response = await sent;
      await exchange.closed;

      expect(response.success).toBe(false);
      expect(response.data).toBeNull();
      expect(response.error).toEqual(getErrorMessage("abort"));
      expect(response.status).toBe(0);
      expect(onRequestError).toHaveBeenCalledTimes(1);
      expect(onRequestFinished).toHaveBeenCalledTimes(1);
    });

    it("should not retry an aborted request", async () => {
      const { client } = createSetup();
      const request = client.createRequest<{ response: { ok: boolean } }>()({
        endpoint: "/abort-retry",
        retry: 3,
        retryTime: 0,
      });
      const started = vi.fn();
      client.requestManager.events.onRequestStart(started);

      const sent = request.send();
      await server.next();
      request.abort();
      const response = await sent;

      expect(response.error).toEqual(getErrorMessage("abort"));
      expect(started).toHaveBeenCalledTimes(1);
      // Nothing is left to run or to retry
      expect(client.fetchDispatcher.getAllRunningRequests()).toHaveLength(0);
      expect(client.fetchDispatcher.getQueue(scopeKey(request.queryKey, request.scope)).requests).toHaveLength(0);
    });

    it("should abort while the body is still downloading", async () => {
      const { client, onRequestError } = createSetup();
      const request = client.createRequest<{ response: string }>()({ endpoint: "/abort-body" });
      let downloaded = () => {};
      const firstProgress = new Promise<void>((resolve) => {
        downloaded = resolve;
      });

      const sent = request.send({ onDownloadProgress: () => downloaded() });
      const exchange = await server.next();
      exchange.res.writeHead(200, { "Content-Type": "text/plain", "Content-Length": "10" });
      await write(exchange.res, "12345");
      await firstProgress;
      request.abort();
      const response = await sent;
      await exchange.closed;

      expect(response.error).toEqual(getErrorMessage("abort"));
      expect(response.data).toBeNull();
      expect(onRequestError).toHaveBeenCalledTimes(1);
    });

    it("should not abort other requests that are in flight", async () => {
      const { client } = createSetup();
      const first = client.createRequest<{ response: { id: number } }>()({ endpoint: "/first" });
      const second = client.createRequest<{ response: { id: number } }>()({ endpoint: "/second" });

      const sentFirst = first.send();
      const firstExchange = await server.next();
      const sentSecond = second.send();
      const secondExchange = await server.next();
      first.abort();
      json(secondExchange.res, 200, { id: 2 });
      const [firstResponse, secondResponse] = await Promise.all([sentFirst, sentSecond]);
      await firstExchange.closed;

      expect(firstResponse.error).toEqual(getErrorMessage("abort"));
      expect(secondResponse.data).toEqual({ id: 2 });
    });
  });

  describe("when the response arrives in several pieces", () => {
    it("should report the request end and the response start once", async () => {
      const { client } = createSetup();
      const request = client.createRequest<{ response: string }>()({ endpoint: "/pieces" });
      const onResponseStart = vi.fn();
      const requestEnded = vi.fn();
      const loaded: number[] = [];
      let progressed = () => {};
      let nextProgress = new Promise<void>((resolve) => {
        progressed = resolve;
      });

      const sent = request.send({
        onResponseStart,
        onUploadProgress: ({ loaded: bytes, total }) => bytes === total && requestEnded(),
        onDownloadProgress: (event) => {
          loaded.push(event.loaded);
          progressed();
        },
      });
      const exchange = await server.next();
      exchange.res.writeHead(200, { "Content-Type": "text/plain", "Content-Length": "9" });
      for (const piece of ["abc", "def"]) {
        // eslint-disable-next-line no-await-in-loop
        await write(exchange.res, piece);
        // eslint-disable-next-line no-await-in-loop
        await nextProgress;
        nextProgress = new Promise<void>((resolve) => {
          progressed = resolve;
        });
      }
      exchange.res.end("ghi");
      const response = await sent;

      expect(response.data).toBe("abcdefghi");
      expect(onResponseStart).toHaveBeenCalledTimes(1);
      // Loaded bytes never go backwards and end at the full size
      expect([...loaded].sort((a, b) => a - b)).toEqual(loaded);
      expect(loaded.at(-1)).toBe(9);
    });

    it("should keep the response start time of the first piece", async () => {
      const { client } = createSetup();
      const request = client.createRequest<{ response: string }>()({ endpoint: "/timestamps" });
      const starts: number[] = [];
      let progressed = () => {};
      const firstProgress = new Promise<void>((resolve) => {
        progressed = resolve;
      });

      const sent = request.send({
        onDownloadProgress: (event) => {
          starts.push(event.startTimestamp);
          progressed();
        },
      });
      const exchange = await server.next();
      exchange.res.writeHead(200, { "Content-Type": "text/plain", "Content-Length": "6" });
      await write(exchange.res, "abc");
      await firstProgress;
      exchange.res.end("def");
      await sent;

      expect(new Set(starts.filter((_, index) => index > 0)).size).toBe(1);
    });
  });

  describe("when the response has no body", () => {
    it.each([204, 205, 304])("should still report the response start for a %i", async (status) => {
      const { client, onRequestSuccess, onRequestError } = createSetup();
      const request = client.createRequest<{ response: null }>()({ endpoint: "/empty" });
      const onResponseStart = vi.fn();
      const onRequestStart = vi.fn();

      const sent = request.send({ onResponseStart, onRequestStart });
      const exchange = await server.next();
      exchange.res.writeHead(status);
      exchange.res.end();
      const response = await sent;

      expect(response.status).toBe(status);
      expect(onRequestStart).toHaveBeenCalledTimes(1);
      expect(onResponseStart).toHaveBeenCalledTimes(1);
      expect(onRequestSuccess.mock.calls.length + onRequestError.mock.calls.length).toBe(1);
    });
  });

  describe("when the request fails", () => {
    it.each([400, 401, 403, 404, 409, 422, 429, 500, 502, 503])(
      "should return the %i status, the axios error and the response headers",
      async (status) => {
        const { client, onRequestError } = createSetup();
        const request = client.createRequest<{ response: { ok: boolean } }>()({ endpoint: "/failing" });

        const sent = request.send();
        const exchange = await server.next();
        json(exchange.res, status, { message: "Nope" });
        const response = await sent;

        expect(response.success).toBe(false);
        expect(response.data).toBeNull();
        expect(response.status).toBe(status);
        expect((response.error as { response?: { data: unknown } }).response?.data).toEqual({ message: "Nope" });
        expect(response.extra?.headers["x-trace"]).toBe("abc");
        expect(onRequestError).toHaveBeenCalledTimes(1);
      },
    );

    it("should return the system status and empty headers when the connection breaks", async () => {
      const { client, onRequestError } = createSetup();
      const request = client.createRequest<{ response: { ok: boolean } }>()({ endpoint: "/broken" });

      const sent = request.send();
      const exchange = await server.next();
      exchange.req.socket.destroy();
      const response = await sent;

      expect(response.success).toBe(false);
      expect(response.status).toBe(0);
      expect(response.error).toBeInstanceOf(Error);
      expect(response.extra).toEqual({ headers: {} });
      expect(onRequestError).toHaveBeenCalledTimes(1);
    });

    it("should fail with the axios timeout error when the `timeout` option runs out", async () => {
      const { client } = createSetup();
      const request = client.createRequest<{ response: { ok: boolean } }>()({
        endpoint: "/slow",
        options: { timeout: 30 },
      });

      const sent = request.send();
      const exchange = await server.next();
      const response = await sent;
      await exchange.closed;

      expect(response.success).toBe(false);
      expect(response.status).toBe(0);
      expect((response.error as { code?: string }).code).toBe("ECONNABORTED");
      expect(response.extra).toEqual({ headers: {} });
    });

    it("should retry a failed request and succeed", async () => {
      const { client } = createSetup();
      const request = client.createRequest<{ response: { ok: boolean } }>()({
        endpoint: "/flaky",
        retry: 2,
        retryTime: 0,
      });

      const sent = request.send();
      json((await server.next()).res, 503, { message: "Busy" });
      json((await server.next()).res, 503, { message: "Busy" });
      json((await server.next()).res, 200, { ok: true });
      const response = await sent;

      expect(response.data).toEqual({ ok: true });
      expect(response.status).toBe(200);
    });
  });

  describe("when sending data", () => {
    it("should send the method, headers, query params and a JSON payload", async () => {
      const { client } = createSetup();
      const request = client
        .createRequest<{
          response: { ok: boolean };
          payload: { name: string };
          queryParams: { page: number; tags: string[] };
        }>()({
          endpoint: "/users/:id",
          method: "PATCH",
          headers: { "X-Custom": "yes" },
        })
        .setParams({ id: 7 });

      const sent = request.send({ payload: { name: "Zażółć" }, queryParams: { page: 2, tags: ["a", "b"] } });
      const exchange = await server.next();
      json(exchange.res, 200, { ok: true });
      const response = await sent;

      expect(exchange.req.method).toBe("PATCH");
      expect(exchange.req.url).toBe("/users/7?page=2&tags[]=a&tags[]=b");
      expect(exchange.req.headers["x-custom"]).toBe("yes");
      expect(exchange.req.headers["content-type"]).toContain("application/json");
      expect(JSON.parse(exchange.body)).toEqual({ name: "Zażółć" });
      expect(response.data).toEqual({ ok: true });
    });

    it.each(["GET", "POST", "PUT", "PATCH", "DELETE"] as const)("should send a %s request", async (method) => {
      const { client } = createSetup();
      const request = client.createRequest<{ response: { ok: boolean } }>()({ endpoint: "/method", method });

      const sent = request.send();
      const exchange = await server.next();
      json(exchange.res, 200, { ok: true });
      const response = await sent;

      expect(exchange.req.method).toBe(method);
      expect(response.data).toEqual({ ok: true });
    });

    it("should pass axios options through", async () => {
      const { client } = createSetup();
      const request = client.createRequest<{ response: string }>()({
        endpoint: "/options",
        options: { responseType: "text", transformResponse: (data: string) => data.toUpperCase() },
      });

      const sent = request.send();
      const exchange = await server.next();
      json(exchange.res, 200, { ok: true });
      const response = await sent;

      expect(response.data).toBe('{"OK":TRUE}');
    });

    it("should report the upload of a payload up to its full size", async () => {
      const { client } = createSetup();
      const request = client.createRequest<{ response: { ok: boolean }; payload: { text: string } }>()({
        endpoint: "/upload",
        method: "POST",
      });
      const uploads: { loaded: number; total: number }[] = [];

      const sent = request.send({
        payload: { text: "x".repeat(2000) },
        onUploadProgress: ({ loaded, total }) => uploads.push({ loaded, total }),
      });
      const exchange = await server.next();
      json(exchange.res, 200, { ok: true });
      await sent;

      expect(exchange.body.length).toBeGreaterThan(2000);
      expect(uploads.length).toBeGreaterThan(0);
      expect(uploads.at(-1)?.loaded).toBe(uploads.at(-1)?.total);
    });
  });

  describe("when several requests run", () => {
    it("should keep concurrent responses apart", async () => {
      const { client } = createSetup();
      const request = client.createRequest<{ response: { id: string }; queryParams: { id: string } }>()({
        endpoint: "/concurrent",
      });

      const sent = ["a", "b", "c", "d"].map((id) => request.send({ queryParams: { id } }));
      const exchanges = await Promise.all(sent.map(() => server.next()));
      // Answer in reverse order
      [...exchanges].reverse().forEach((exchange) => {
        const id = new URL(exchange.req.url ?? "", baseUrl).searchParams.get("id");
        json(exchange.res, 200, { id });
      });
      const responses = await Promise.all(sent);

      expect(responses.map((response) => response.data?.id)).toEqual(["a", "b", "c", "d"]);
    });

    it("should fire the lifecycle callbacks once and in order", async () => {
      const { client } = createSetup();
      const request = client.createRequest<{ response: { ok: boolean } }>()({ endpoint: "/order" });
      const order: string[] = [];

      const sent = request.send({
        onBeforeSent: () => order.push("before"),
        onRequestStart: () => order.push("request-start"),
        onResponseStart: () => order.push("response-start"),
        onResponse: () => order.push("response"),
      });
      const exchange = await server.next();
      json(exchange.res, 200, { ok: true });
      await sent;

      expect(order).toEqual(["before", "request-start", "response-start", "response"]);
    });
  });
});

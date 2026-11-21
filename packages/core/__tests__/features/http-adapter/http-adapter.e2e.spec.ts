/**
 * @vitest-environment node
 */
import { Client } from "@hyper-fetch/core";
import http from "http";
import type { AddressInfo } from "net";
import { gzipSync } from "zlib";

import { createDeferred } from "../../utils/controlled-adapter.utils";

type Echo = {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  bodyLength: number;
};

/**
 * Real HTTP server on a random port. Responses which must not finish on their own are held until the test (or the
 * teardown) releases them, so nothing here depends on how fast the machine is.
 */
describe("E2E [ Fetch adapter ]", () => {
  const binaryData = Buffer.from(Array.from({ length: 256 }, (_, index) => index));
  const gzipData = Array.from({ length: 5000 }, (_, index) => ({ id: index, name: "compressible user name" }));
  let server: http.Server;
  let baseUrl = "";
  let hits: string[] = [];
  /** Resolved with the response of a held request when it reaches the server */
  let received = createDeferred<http.ServerResponse>();
  const heldResponses: http.ServerResponse[] = [];

  const sendJson = (res: http.ServerResponse, status: number, data: unknown) => {
    const body = JSON.stringify(data);
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Content-Length": String(Buffer.byteLength(body)),
      "X-Custom-Response": "yes",
    });
    res.end(body);
  };

  const handle = (req: http.IncomingMessage, res: http.ServerResponse, body: Buffer) => {
    const { pathname } = new URL(req.url || "/", "http://localhost");
    hits.push(pathname);

    if (pathname === "/echo") {
      const echo: Echo = {
        method: req.method || "",
        url: req.url || "",
        headers: req.headers as Record<string, string>,
        body: body.toString("utf8"),
        bodyLength: body.length,
      };
      return sendJson(res, 200, echo);
    }
    if (pathname.startsWith("/status/")) {
      const status = Number(pathname.split("/")[2]);
      if ([204, 205, 304].includes(status)) {
        res.writeHead(status);
        return res.end();
      }
      return sendJson(res, status, { status });
    }
    if (pathname.startsWith("/empty/")) {
      res.writeHead(Number(pathname.split("/")[2]));
      return res.end();
    }
    if (pathname === "/text") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      return res.end("plain text response");
    }
    if (pathname === "/invalid-json") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end('{"broken": ');
    }
    if (pathname === "/text-error") {
      res.writeHead(500, { "Content-Type": "text/plain" });
      return res.end("Something exploded");
    }
    if (pathname.startsWith("/redirect/")) {
      res.writeHead(Number(pathname.split("/")[2]), { Location: "/echo" });
      return res.end();
    }
    // Never answers
    if (pathname === "/hold") {
      heldResponses.push(res);
      return received.resolve(res);
    }
    // Sends the headers and a part of the body, then stops
    if (pathname === "/hold-body") {
      res.writeHead(200, { "Content-Type": "application/json", "Content-Length": "100" });
      res.write('{"partial":');
      heldResponses.push(res);
      return received.resolve(res);
    }
    // Every byte value - not valid UTF-8, so decoding it as text corrupts it
    if (pathname === "/binary") {
      res.writeHead(200, { "Content-Type": "application/octet-stream", "Content-Length": String(binaryData.length) });
      return res.end(binaryData);
    }
    if (pathname === "/binary-error") {
      return sendJson(res, 404, { message: "File not found" });
    }
    // Compressed body - Content-Length tells the size of the compressed bytes, fetch reads the decompressed ones
    if (pathname === "/gzip") {
      const compressed = gzipSync(JSON.stringify(gzipData));
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Content-Encoding": "gzip",
        "Content-Length": String(compressed.length),
      });
      const half = Math.floor(compressed.length / 2);
      res.write(compressed.subarray(0, half));
      return setImmediate(() => res.end(compressed.subarray(half)));
    }
    if (pathname === "/chunks") {
      res.writeHead(200, { "Content-Type": "text/plain", "Content-Length": "9" });
      res.write("aaa");
      // Separate writes to deliver the body in more than one piece
      return setImmediate(() => {
        res.write("bbb");
        setImmediate(() => res.end("ccc"));
      });
    }
    res.writeHead(404, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ message: "Not Found" }));
  };

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      const chunks: Uint8Array[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(new Uint8Array(chunk)));
      req.on("end", () => handle(req, res, Buffer.concat(chunks)));
    });
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  beforeEach(() => {
    hits = [];
    received = createDeferred<http.ServerResponse>();
  });

  afterEach(() => {
    heldResponses.splice(0).forEach((res) => res.destroy());
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  afterAll(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => {
      server.close(resolve);
    });
  });

  const createClient = () => new Client({ url: baseUrl });
  const createEcho = (options: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" } = {}) =>
    createClient().createRequest<{ response: Echo; payload: any; queryParams: any }>()({
      endpoint: "/echo",
      method: "POST",
      ...options,
    });

  describe("When sending with different methods", () => {
    it.each(["GET", "POST", "PUT", "PATCH", "DELETE"] as const)("should send the %s request", async (method) => {
      const { data, status, success } = await createEcho({ method }).send();

      expect(data?.method).toBe(method);
      expect(status).toBe(200);
      expect(success).toBe(true);
    });

    it("should use GET by default", async () => {
      const request = createClient().createRequest<{ response: Echo }>()({ endpoint: "/echo" });

      await expect(request.send()).resolves.toHaveProperty("data.method", "GET");
    });

    it.each(["POST", "PUT", "PATCH", "DELETE"] as const)("should send the body with %s", async (method) => {
      const { data } = await createEcho({ method }).send({ payload: { value: 1 } });

      expect(data?.body).toBe('{"value":1}');
    });

    it("should not send the body with GET", async () => {
      const { data, success } = await createEcho({ method: "GET" }).send({ payload: { value: 1 } });

      expect(success).toBe(true);
      expect(data?.bodyLength).toBe(0);
    });
  });

  describe("When building the url", () => {
    it("should put the params into the path", async () => {
      const request = createClient().createRequest<{ response: { status: number } }>()({ endpoint: "/status/:code" });

      const { data } = await request.send({ params: { code: 201 } });

      expect(data).toEqual({ status: 201 });
      expect(hits).toEqual(["/status/201"]);
    });

    it.each([
      [{ page: 1, search: "john" }, "/echo?page=1&search=john"],
      [{ search: "a b&c=d/e?f#g" }, `/echo?search=${encodeURIComponent("a b&c=d/e?f#g")}`],
      [{ ids: [1, 2, 3] }, "/echo?ids[]=1&ids[]=2&ids[]=3"],
      [{ empty: "", missing: null, skipped: undefined, kept: 0 }, "/echo?kept=0"],
      [{ emoji: "żółć 🎉" }, `/echo?emoji=${encodeURIComponent("żółć 🎉")}`],
      ["raw=1&other=2", "/echo?raw=1&other=2"],
    ])("should send the query params %o", async (queryParams, url) => {
      const { data } = await createEcho({ method: "GET" }).send({ queryParams });

      expect(data?.url).toBe(url);
    });

    it("should send no query string without query params", async () => {
      const { data } = await createEcho({ method: "GET" }).send();

      expect(data?.url).toBe("/echo");
    });
  });

  describe("When sending headers", () => {
    it("should describe a JSON payload with the content type", async () => {
      const { data } = await createEcho().send({ payload: { value: 1 } });

      expect(data?.headers["content-type"]).toBe("application/json");
    });

    it("should not send the content type without a payload", async () => {
      const { data } = await createEcho().send();

      expect(data?.headers["content-type"]).toBeUndefined();
    });

    it("should send the headers of the request", async () => {
      const { data } = await createEcho().setHeaders({ "X-Api-Key": "key", Authorization: "Bearer token" }).send();

      expect(data?.headers).toMatchObject({ "x-api-key": "key", authorization: "Bearer token" });
    });

    it("should send the headers given as the Headers instance", async () => {
      const headers = new Headers({ "X-Api-Key": "key" });

      const { data } = await createEcho()
        .setHeaders(headers)
        .send({ payload: { value: 1 } });

      expect(data?.headers).toMatchObject({ "x-api-key": "key", "content-type": "application/json" });
    });

    it("should send the headers given as a list of pairs", async () => {
      const { data } = await createEcho()
        .setHeaders([
          ["X-Api-Key", "key"],
          ["X-Other", "other"],
        ])
        .send();

      expect(data?.headers).toMatchObject({ "x-api-key": "key", "x-other": "other" });
      expect(data?.headers["0"]).toBeUndefined();
    });

    it.each(["Content-Type", "content-type", "CONTENT-TYPE"])(
      "should replace the default content type with the %s header of the request",
      async (name) => {
        const { data } = await createEcho()
          .setHeaders({ [name]: "application/vnd.api+json" })
          .send({ payload: { value: 1 } });

        expect(data?.headers["content-type"]).toBe("application/vnd.api+json");
      },
    );

    it("should not send a header with an empty value - also the default one", async () => {
      const headers = { "Content-Type": undefined, "X-Removed": null, "X-Kept": "1" } as unknown as HeadersInit;

      const { data } = await createEcho()
        .setHeaders(headers)
        .send({ payload: { value: 1 } });

      expect(data?.headers["x-kept"]).toBe("1");
      expect(data?.headers["x-removed"]).toBeUndefined();
      expect(data?.headers["content-type"]).not.toBe("application/json");
    });

    it("should use the headers given to send over the headers of the request", async () => {
      const { data } = await createEcho()
        .setHeaders({ "X-Version": "1" })
        .send({ headers: { "X-Version": "2" } });

      expect(data?.headers["x-version"]).toBe("2");
    });

    it("should send the headers added by the request interceptor", async () => {
      const client = createClient().onRequest((request) =>
        request.setHeaders({ ...request.headers, "X-Trace": "abc" }),
      );
      const request = client.createRequest<{ response: Echo }>()({ endpoint: "/echo" });

      const { data } = await request.setHeaders({ "X-Own": "1" }).send();

      expect(data?.headers).toMatchObject({ "x-trace": "abc", "x-own": "1" });
    });

    it("should give the response headers with lowercase names", async () => {
      const { extra } = await createEcho().send();

      expect(extra?.headers).toMatchObject({ "x-custom-response": "yes", "content-type": "application/json" });
    });
  });

  describe("When sending payloads", () => {
    it.each([
      ["an object", { name: "John", tags: ["a", "b"], nested: { ok: true } }],
      ["an array", [1, "two", { three: 3 }]],
      ["a date inside", { at: new Date(0) }],
      ["a unicode text inside", { text: "zażółć gęślą jaźń 🎉" }],
    ])("should send %s as JSON", async (_, payload) => {
      const { data } = await createEcho().send({ payload });

      const sentBody = JSON.stringify(payload);

      expect(data?.body).toBe(sentBody);
      expect(data?.headers["content-type"]).toBe("application/json");
    });

    it.each([
      ["zero", 0, "0"],
      ["false", false, "false"],
      ["a string", "text", '"text"'],
    ])("should send %s as a JSON value", async (_, payload, body) => {
      const { data } = await createEcho().send({ payload });

      expect(data?.body).toBe(body);
    });

    it.each([
      ["null", null],
      ["undefined", undefined],
    ])("should send no body for %s", async (_, payload) => {
      const { data, success } = await createEcho().send({ payload });

      expect(success).toBe(true);
      expect(data?.bodyLength).toBe(0);
    });

    it("should send FormData as a multipart body", async () => {
      const payload = new FormData();
      payload.append("name", "John");
      payload.append("file", new Blob(["file content"], { type: "text/plain" }), "notes.txt");

      const { data } = await createEcho().send({ payload });

      expect(data?.headers["content-type"]).toMatch(/^multipart\/form-data; boundary=/);
      expect(data?.body).toContain('name="name"');
      expect(data?.body).toContain("John");
      expect(data?.body).toContain('filename="notes.txt"');
      expect(data?.body).toContain("file content");
    });

    it("should send a Blob with its own type", async () => {
      const payload = new Blob(["blob content"], { type: "text/csv" });

      const { data } = await createEcho().send({ payload });

      expect(data?.body).toBe("blob content");
      expect(data?.headers["content-type"]).toBe("text/csv");
    });

    it("should send an ArrayBuffer as raw bytes", async () => {
      const payload = new Uint8Array([1, 2, 3, 250, 251]).buffer;

      const { data } = await createEcho().send({ payload });

      expect(data?.bodyLength).toBe(5);
      expect(data?.headers["content-type"]).not.toBe("application/json");
    });

    it("should send a typed array as raw bytes", async () => {
      const { data } = await createEcho().send({ payload: new TextEncoder().encode("typed") });

      expect(data?.body).toBe("typed");
    });

    it("should send URLSearchParams as a form", async () => {
      const payload = new URLSearchParams({ name: "John Doe", role: "admin&owner" });

      const { data } = await createEcho().send({ payload });

      expect(data?.body).toBe("name=John+Doe&role=admin%26owner");
      expect(data?.headers["content-type"]).toBe("application/x-www-form-urlencoded;charset=UTF-8");
    });

    it("should send a large payload completely", async () => {
      const payload = { text: "x".repeat(500_000) };

      const { data } = await createEcho().send({ payload });

      expect(data?.bodyLength).toBe(JSON.stringify(payload).length);
    });

    it("should send the payload returned by the payload mapper", async () => {
      const request = createEcho().setPayloadMapper((payload: { name: string }) => `name=${payload.name}`);

      const { data } = await request.send({ payload: { name: "John" } });

      expect(data?.body).toBe("name=John");
    });
  });

  describe("When receiving responses", () => {
    const get = (endpoint: string, options?: object) =>
      createClient().createRequest<{ response: any; error: any }>()({ endpoint, ...options });

    it("should parse the JSON body", async () => {
      const { data, error } = await get("/status/200").send();

      expect(data).toEqual({ status: 200 });
      expect(error).toBeNull();
    });

    it("should give the text body as a string", async () => {
      const { data, success } = await get("/text").send();

      expect(data).toBe("plain text response");
      expect(success).toBe(true);
    });

    it.each([204, 205])("should succeed with the empty %i response", async (status) => {
      const response = await get(`/status/${status}`).send();

      expect(response.success).toBe(true);
      expect(response.status).toBe(status);
      expect(response.error).toBeNull();
      expect(response.data).toBeFalsy();
    });

    it("should succeed with an empty 200 response", async () => {
      const response = await get("/empty/200").send();

      expect(response.success).toBe(true);
      expect(response.error).toBeNull();
    });

    it("should not fail on an invalid JSON body", async () => {
      const response = await get("/invalid-json").send();

      expect(response.status).toBe(200);
      expect(response.error).toBeNull();
    });

    it.each([200, 201, 202])("should treat the %i status as a success", async (status) => {
      const response = await get(`/status/${status}`).send();

      expect(response).toMatchObject({ success: true, status, error: null, data: { status } });
    });

    it.each([400, 401, 403, 404, 409, 422, 429, 500, 502, 503])(
      "should treat the %i status as an error with the parsed body",
      async (status) => {
        const response = await get(`/status/${status}`).send();

        expect(response).toMatchObject({ success: false, status, data: null, error: { status } });
      },
    );

    it("should give the text of a non-JSON error body", async () => {
      const response = await get("/text-error").send();

      expect(response).toMatchObject({ success: false, status: 500, error: "Something exploded" });
    });

    it.each([400, 500])("should give the unexpected error for the %i status without a body", async (status) => {
      const response = await get(`/empty/${status}`).send();

      expect(response.success).toBe(false);
      expect(response.status).toBe(status);
      expect(response.error.message).toBe("Unexpected error");
    });

    it("should give the response timestamps in order", async () => {
      const before = Date.now();

      const { requestTimestamp, responseTimestamp } = await get("/status/200").send();

      expect(requestTimestamp).toBeGreaterThanOrEqual(before);
      expect(responseTimestamp).toBeGreaterThanOrEqual(requestTimestamp);
    });

    it("should give the same result with exec", async () => {
      const response = await get("/status/404").exec({});

      expect(response).toMatchObject({ success: false, status: 404, error: { status: 404 } });
    });
  });

  describe("When choosing the response type", () => {
    const getBinary = <Response>(endpoint: string, responseType: "blob" | "arrayBuffer" | "text" | "json") =>
      createClient().createRequest<{ response: Response; error: { message: string } }>()({
        endpoint,
        options: { responseType },
      });

    it("should give the body as an ArrayBuffer without changing the bytes", async () => {
      const { data } = await getBinary<ArrayBuffer>("/binary", "arrayBuffer").send();

      expect(data).toBeInstanceOf(ArrayBuffer);
      expect(Buffer.from(data!)).toStrictEqual(binaryData);
    });

    it("should give the body as a Blob with the content type of the response", async () => {
      const { data } = await getBinary<Blob>("/binary", "blob").send();

      expect(data).toBeInstanceOf(Blob);
      expect(data!.type).toBe("application/octet-stream");
      expect(Buffer.from(await data!.arrayBuffer())).toStrictEqual(binaryData);
    });

    it("should give a JSON body as text without parsing it", async () => {
      const { data } = await getBinary<string>("/status/200", "text").send();

      expect(data).toBe(JSON.stringify({ status: 200 }));
    });

    it("should parse a JSON body with the json response type", async () => {
      const { data } = await getBinary<{ status: number }>("/status/200", "json").send();

      expect(data).toStrictEqual({ status: 200 });
    });

    it("should parse the error body of a binary request", async () => {
      const { data, error, status } = await getBinary<Blob>("/binary-error", "blob").send();

      expect(data).toBeNull();
      expect(status).toBe(404);
      expect(error).toStrictEqual({ message: "File not found" });
    });

    it("should report the download progress of a binary body", async () => {
      const progress: number[] = [];

      await getBinary<ArrayBuffer>("/binary", "arrayBuffer").send({
        onDownloadProgress: (event) => progress.push(event.progress),
      });

      expect(progress.at(-1)).toBe(100);
    });

    it("should not pass the response type to fetch", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      await getBinary<ArrayBuffer>("/binary", "arrayBuffer").send();

      expect(fetchSpy.mock.calls[0][1]).not.toHaveProperty("responseType");
    });
  });

  describe("When the response is compressed", () => {
    it("should decompress the body", async () => {
      const request = createClient().createRequest<{ response: typeof gzipData }>()({ endpoint: "/gzip" });

      const { data } = await request.send();

      expect(data).toStrictEqual(gzipData);
    });

    it("should never report the download progress above 100%", async () => {
      const request = createClient().createRequest<{ response: typeof gzipData }>()({ endpoint: "/gzip" });
      const progress: number[] = [];

      await request.send({ onDownloadProgress: (event) => progress.push(event.progress) });

      expect(progress.length).toBeGreaterThan(1);
      expect(Math.max(...progress)).toBe(100);
      expect(progress.at(-1)).toBe(100);
    });

    it("should report the size of the decompressed body as the total", async () => {
      const request = createClient().createRequest<{ response: typeof gzipData }>()({ endpoint: "/gzip" });
      const totals: number[] = [];

      await request.send({ onDownloadProgress: (event) => totals.push(event.total) });

      expect(totals.at(-1)).toBe(Buffer.byteLength(JSON.stringify(gzipData)));
    });
  });

  describe("When the server redirects", () => {
    it.each([301, 302, 303, 307, 308])("should follow the %i redirect", async (status) => {
      const request = createClient().createRequest<{ response: Echo }>()({ endpoint: `/redirect/${status}` });

      const response = await request.send();

      expect(response.status).toBe(200);
      expect(response.data?.url).toBe("/echo");
      expect(hits).toEqual([`/redirect/${status}`, "/echo"]);
    });

    it("should not follow the redirect with the manual redirect option", async () => {
      const request = createClient().createRequest<{ response: Echo }>()({
        endpoint: "/redirect/302",
        options: { redirect: "manual" },
      });

      const response = await request.send();

      expect(response.status).toBe(302);
      expect(hits).toEqual(["/redirect/302"]);
    });

    it("should fail on the redirect with the error redirect option", async () => {
      const request = createClient().createRequest<{ response: Echo }>()({
        endpoint: "/redirect/302",
        options: { redirect: "error" },
      });

      const response = await request.send();

      expect(response.success).toBe(false);
      expect(response.status).toBe(0);
      expect(hits).toEqual(["/redirect/302"]);
    });
  });

  describe("When passing the fetch options", () => {
    it("should pass the options of the request to fetch", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");
      const options = {
        credentials: "include",
        mode: "cors",
        cache: "no-store",
        keepalive: true,
        referrerPolicy: "no-referrer",
      } as const;

      await createEcho()
        .setOptions(options)
        .send({ payload: { value: 1 } });
      const [url, init] = fetchSpy.mock.calls[0];

      expect(url).toBe(`${baseUrl}/echo`);
      expect(init).toMatchObject({ ...options, method: "POST", body: '{"value":1}' });
      expect(init?.signal).toBeInstanceOf(AbortSignal);
    });

    it("should not pass its own options to fetch", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      await createEcho().setOptions({ timeout: 30_000, streaming: false }).send();
      const [, init] = fetchSpy.mock.calls[0];

      expect(init).not.toHaveProperty("timeout");
      expect(init).not.toHaveProperty("streaming");
    });

    it("should use the adapter defaults under the options of the request", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");
      const client = createClient();
      client.adapter.setAdapterDefaults(() => ({ credentials: "include", cache: "no-store" }));
      const request = client.createRequest()({ endpoint: "/echo", options: { cache: "reload" } });

      await request.send();
      const [, init] = fetchSpy.mock.calls[0];

      expect(init).toMatchObject({ credentials: "include", cache: "reload" });
    });

    it("should call fetch once per request", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      await createEcho().send();

      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("When the request times out", () => {
    const hold = (endpoint: string, timeout: number) =>
      createClient().createRequest<{ response: unknown; error: Error }>()({ endpoint, options: { timeout } });

    it("should give the timeout error when the server does not answer", async () => {
      const response = await hold("/hold", 20).send();

      expect(response.success).toBe(false);
      expect(response.status).toBe(0);
      expect(response.data).toBeNull();
      expect(response.error?.message).toBe("Request timeout");
    });

    it("should give the timeout error when the body stops arriving", async () => {
      // Only the timeout of the adapter is faked - it passes exactly when the headers are already here
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      const responseStarted = createDeferred();

      const sent = hold("/hold-body", 5000).send({ onResponseStart: () => responseStarted.resolve() });
      await responseStarted.promise;
      vi.advanceTimersByTime(5000);
      const response = await sent;

      expect(response.success).toBe(false);
      expect(response.status).toBe(0);
      expect(response.error?.message).toBe("Request timeout");
    });

    it("should not time out before the given time passes", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      const responseStarted = createDeferred();
      const onResponse = vi.fn();

      const sent = hold("/hold-body", 5000).send({ onResponseStart: () => responseStarted.resolve(), onResponse });
      await responseStarted.promise;
      vi.advanceTimersByTime(4999);
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      expect(onResponse).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);

      await expect(sent).resolves.toHaveProperty("error.message", "Request timeout");
    });

    it("should close the connection of a timed out request", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      const closed = createDeferred();

      const sent = hold("/hold", 5000).send();
      const res = await received.promise;
      res.on("close", () => closed.resolve());
      vi.advanceTimersByTime(5000);
      await sent;

      await expect(closed.promise).resolves.toBeUndefined();
    });

    it("should give the timeout error with exec", async () => {
      const response = await hold("/hold", 20).exec({});

      expect(response.error?.message).toBe("Request timeout");
    });

    it("should use the timeout of the adapter defaults", async () => {
      const client = createClient();
      client.adapter.setAdapterDefaults(() => ({ timeout: 20 }));

      const response = await client.createRequest<{ error: Error }>()({ endpoint: "/hold" }).send();

      expect(response.error?.message).toBe("Request timeout");
    });

    it("should not time out a request which finished in time", async () => {
      const client = createClient();
      const request = client.createRequest<{ response: Echo }>()({ endpoint: "/echo", options: { timeout: 60_000 } });
      const onAbort = vi.fn();
      client.requestManager.events.onAbort(onAbort);

      const response = await request.send();

      expect(response.success).toBe(true);
      expect(onAbort).not.toHaveBeenCalled();
    });

    it("should retry a timed out request", async () => {
      const request = createClient().createRequest<{ error: Error }>()({
        endpoint: "/hold",
        options: { timeout: 20 },
        retry: 1,
        retryTime: 0,
      });

      const fetchSpy = vi.spyOn(globalThis, "fetch");

      const response = await request.send();

      expect(response.error?.message).toBe("Request timeout");
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("When the request is aborted", () => {
    const createHeld = (endpoint: string) => {
      const client = createClient();
      const request = client.createRequest<{ response: unknown; error: Error }>()({
        endpoint,
        options: { timeout: 60_000 },
      });
      return { client, request };
    };

    it("should not reach the server when aborted right after sending", async () => {
      const { request } = createHeld("/hold");

      const sent = request.send();
      request.abort();
      const response = await sent;

      expect(response.error?.message).toBe("Request aborted");
      expect(response.status).toBe(0);
      expect(hits).toEqual([]);
    });

    it("should abort the request waiting for the response", async () => {
      const { request } = createHeld("/hold");

      const sent = request.send();
      await received.promise;
      request.abort();
      const response = await sent;

      expect(response.success).toBe(false);
      expect(response.error?.message).toBe("Request aborted");
    });

    it("should abort the request receiving the body", async () => {
      const { request } = createHeld("/hold-body");
      const responseStarted = createDeferred();

      const sent = request.send({ onResponseStart: () => responseStarted.resolve() });
      await responseStarted.promise;
      request.abort();
      const response = await sent;

      expect(response.success).toBe(false);
      expect(response.error?.message).toBe("Request aborted");
    });

    it("should close the connection of the aborted request", async () => {
      const { request } = createHeld("/hold");
      const closed = createDeferred();

      const sent = request.send();
      const res = await received.promise;
      res.on("close", () => closed.resolve());
      request.abort();
      await sent;

      await expect(closed.promise).resolves.toBeUndefined();
    });

    it("should tell about the abort once", async () => {
      const { client, request } = createHeld("/hold");
      const onAbort = vi.fn();
      client.requestManager.events.onAbort(onAbort);

      const sent = request.send();
      await received.promise;
      request.abort();
      request.abort();
      await sent;

      expect(onAbort).toHaveBeenCalledTimes(1);
    });

    it("should not change the result of a finished request", async () => {
      const request = createEcho({ method: "GET" });

      const response = await request.send();
      request.abort();

      expect(response.success).toBe(true);
      expect(hits).toEqual(["/echo"]);
    });

    it("should abort the request made with exec", async () => {
      const { request } = createHeld("/hold");

      const sent = request.exec({});
      await received.promise;
      request.abort();

      await expect(sent).resolves.toHaveProperty("error.message", "Request aborted");
    });

    it("should not retry the aborted request", async () => {
      const { request } = createHeld("/hold");

      const sent = request.setRetry(3).setRetryTime(0).send();
      await received.promise;
      request.abort();
      await sent;

      expect(hits).toEqual(["/hold"]);
    });

    it("should leave no abort controllers and running requests", async () => {
      const { client, request } = createHeld("/hold");

      const sent = request.send();
      await received.promise;
      request.abort();
      await sent;

      expect(client.requestManager.abortControllers.size).toBe(0);
      expect(client.fetchDispatcher.getAllRunningRequests()).toHaveLength(0);
    });
  });

  describe("When the network fails", () => {
    const createUnreachable = async () => {
      const closedServer = http.createServer();
      await new Promise<void>((resolve) => {
        closedServer.listen(0, "127.0.0.1", resolve);
      });
      const { port } = closedServer.address() as AddressInfo;
      await new Promise((resolve) => {
        closedServer.close(resolve);
      });
      return new Client({ url: `http://127.0.0.1:${port}` });
    };

    it("should give the error with the zero status", async () => {
      const client = await createUnreachable();

      const response = await client.createRequest<{ error: Error }>()({ endpoint: "/unreachable" }).send();

      expect(response.success).toBe(false);
      expect(response.status).toBe(0);
      expect(response.data).toBeNull();
      expect(response.error).toBeInstanceOf(Error);
      expect(response.extra).toEqual({ headers: {} });
    });

    it("should retry the failed request", async () => {
      const client = await createUnreachable();
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      await client.createRequest()({ endpoint: "/unreachable", retry: 2, retryTime: 0 }).send();

      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });

    it("should give the error for a connection dropped by the server", async () => {
      const request = createClient().createRequest<{ error: Error }>()({
        endpoint: "/hold-body",
        options: { timeout: 60_000 },
      });
      const responseStarted = createDeferred();

      const sent = request.send({ onResponseStart: () => responseStarted.resolve() });
      await responseStarted.promise;
      heldResponses.splice(0).forEach((res) => res.destroy());
      const response = await sent;

      expect(response.success).toBe(false);
      expect(response.status).toBe(0);
    });
  });

  describe("When tracking the progress", () => {
    it("should report the download up to the full size", async () => {
      const request = createClient().createRequest<{ response: string }>()({ endpoint: "/chunks" });
      const progress: { loaded: number; total: number; progress: number }[] = [];

      const { data } = await request.send({
        onDownloadProgress: ({ loaded, total, progress: percent }) =>
          progress.push({ loaded, total, progress: percent }),
      });

      expect(data).toBe("aaabbbccc");
      expect(progress.at(-1)).toEqual({ loaded: 9, total: 9, progress: 100 });
      // Never goes back and never reports the same state twice
      progress.slice(1).forEach((current, index) => {
        expect(current.loaded).toBeGreaterThanOrEqual(progress[index].loaded);
        expect(current).not.toEqual(progress[index]);
      });
    });

    it("should report the upload of the payload", async () => {
      const payload = { text: "ż".repeat(100) };
      const size = Buffer.byteLength(JSON.stringify(payload));
      const progress: { loaded: number; total: number }[] = [];

      await createEcho().send({
        payload,
        onUploadProgress: ({ loaded, total }) => progress.push({ loaded, total }),
      });

      expect(progress.at(-1)).toEqual({ loaded: size, total: size });
    });

    it("should report the finished upload only once the server has the body", async () => {
      // Fetch has no upload events - the response is the first sign that the whole body was sent
      const finishedAfterServerGotBody: boolean[] = [];

      await createEcho().send({
        payload: { text: "x".repeat(10_000) },
        onUploadProgress: ({ loaded, total }) => {
          if (loaded === total) finishedAfterServerGotBody.push(hits.includes("/echo"));
        },
      });

      expect(finishedAfterServerGotBody).toEqual([true]);
    });

    it.each([
      ["Blob", () => new Blob(["a".repeat(2048)]), 2048],
      ["ArrayBuffer", () => new Uint8Array(1024).buffer, 1024],
      ["typed array", () => new Uint8Array(512), 512],
      ["URLSearchParams", () => new URLSearchParams({ name: "żółw" }), Buffer.byteLength("name=%C5%BC%C3%B3%C5%82w")],
    ])("should report the size of a %s payload as the upload total", async (_, createPayload, size) => {
      const progress: { loaded: number; total: number }[] = [];

      const { data } = await createEcho().send({
        payload: createPayload(),
        onUploadProgress: ({ loaded, total }) => progress.push({ loaded, total }),
      });

      expect(data?.bodyLength).toBe(size);
      expect(progress[0]).toEqual({ loaded: 0, total: size });
      expect(progress.at(-1)).toEqual({ loaded: size, total: size });
    });

    it("should call the lifecycle callbacks once", async () => {
      const onRequestStart = vi.fn();
      const onResponseStart = vi.fn();
      const onResponse = vi.fn();

      await createEcho().send({ onRequestStart, onResponseStart, onResponse });

      expect(onRequestStart).toHaveBeenCalledTimes(1);
      expect(onResponseStart).toHaveBeenCalledTimes(1);
      expect(onResponse).toHaveBeenCalledTimes(1);
    });
  });

  describe("When many requests are sent", () => {
    it("should give every request its own response", async () => {
      const request = createEcho();

      const responses = await Promise.all(
        Array.from({ length: 50 }, (_, index) => request.send({ payload: { index } })),
      );

      expect(responses.map((response) => JSON.parse(response.data!.body).index)).toEqual(
        Array.from({ length: 50 }, (_, index) => index),
      );
    });

    it("should send one request for the deduplicated calls", async () => {
      const request = createClient().createRequest<{ response: Echo }>()({ endpoint: "/echo" });

      const responses = await Promise.all([request.send(), request.send(), request.send()]);

      expect(hits).toEqual(["/echo"]);
      expect(responses.map((response) => response.status)).toEqual([200, 200, 200]);
    });

    it("should send the queued requests one after another", async () => {
      const request = createEcho().setQueued(true);
      const order: number[] = [];

      await Promise.all(
        [1, 2, 3, 4, 5].map((index) => request.send({ payload: { index }, onResponse: () => order.push(index) })),
      );

      expect(order).toEqual([1, 2, 3, 4, 5]);
    });
  });
});

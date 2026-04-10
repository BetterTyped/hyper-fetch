/**
 * @jest-environment node
 */
import { URL } from "url";
import { Client } from "@hyper-fetch/core";
import {
  createE2EServer,
  jsonHandler,
  redirectHandler,
  streamHandler,
  fileDownloadHandler,
  echoHandler,
  RouteHandler,
} from "@hyper-fetch/testing";

const { route, startServer, stopServer } = createE2EServer();

let baseUrl: string;

beforeAll(async () => {
  // Query Params
  route("GET", "/search", (req, res) => {
    const url = new URL(req.url || "/", `http://localhost`);
    const params: Record<string, string> = {};
    url.searchParams.forEach((value: string, key: string) => {
      params[key] = value;
    });
    const body = JSON.stringify({ params });
    res.writeHead(200, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body).toString() });
    res.end(body);
  });

  // URL Params
  // eslint-disable-next-line max-params
  const usersHandler: RouteHandler = (req, res, _body, params) => {
    const responseBody = JSON.stringify({ id: Number(params.id), name: params.id === "1" ? "Alice" : "Bob" });
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(responseBody).toString(),
    });
    res.end(responseBody);
  };
  route("GET", "/users/:id", usersHandler);

  // eslint-disable-next-line max-params
  const orgsHandler: RouteHandler = (_req, res, _body, params) => {
    const responseBody = JSON.stringify({ org: params.orgId, repo: params.repoId });
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(responseBody).toString(),
    });
    res.end(responseBody);
  };
  route("GET", "/orgs/:orgId/repos/:repoId", orgsHandler);

  // Redirects
  route("GET", "/redirect-302", redirectHandler("/final"));
  route("GET", "/redirect-301", redirectHandler("/final", 301));
  route("GET", "/redirect-chain", redirectHandler("/redirect-302"));
  route("GET", "/final", jsonHandler({ redirected: true }));

  // Streaming
  route("GET", "/stream", streamHandler(["chunk1", "chunk2", "chunk3"], 30));
  route(
    "GET",
    "/stream-large",
    streamHandler(
      Array.from({ length: 20 }, (_, i) => `data-${i}\n`),
      10,
    ),
  );

  // File Download
  const fileContent = Buffer.from("Hello, this is a test file content!");
  route("GET", "/download/test.txt", fileDownloadHandler(fileContent, "test.txt", "text/plain"));
  const binaryContent = Buffer.alloc(1024, 0xab);
  route("GET", "/download/binary.bin", fileDownloadHandler(binaryContent, "binary.bin"));

  // Concurrent
  route("GET", "/item/1", jsonHandler({ id: 1 }));
  route("GET", "/item/2", jsonHandler({ id: 2 }));
  route("GET", "/item/3", jsonHandler({ id: 3 }));

  // Callbacks
  route("POST", "/callback-test", echoHandler);

  // Validation
  route("POST", "/validate", (req, res, body) => {
    try {
      const parsed = JSON.parse(body.toString());
      if (!parsed.email) {
        const errBody = JSON.stringify({ errors: { email: "Email is required" } });
        res.writeHead(422, {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(errBody).toString(),
        });
        res.end(errBody);
        return;
      }
      const okBody = JSON.stringify({ success: true });
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(okBody).toString(),
      });
      res.end(okBody);
    } catch {
      const errBody = JSON.stringify({ message: "Invalid JSON" });
      res.writeHead(400, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(errBody).toString(),
      });
      res.end(errBody);
    }
  });

  baseUrl = await startServer();
});

afterAll(async () => {
  await stopServer();
});

describe("E2E [ Query Params ]", () => {
  it("should send query params", async () => {
    const client = new Client({ url: baseUrl });
    const request = client
      .createRequest<{
        response: { params: Record<string, string> };
        queryParams: { q: string; page: string };
      }>()({
        endpoint: "/search",
        method: "GET",
      })
      .setQueryParams({ q: "hyper-fetch", page: "1" });

    const { data, error } = await request.send();

    expect(error).toBeNull();
    expect(data!.params.q).toBe("hyper-fetch");
    expect(data!.params.page).toBe("1");
  });

  it("should handle special characters in query params", async () => {
    const client = new Client({ url: baseUrl });
    const request = client
      .createRequest<{
        response: { params: Record<string, string> };
        queryParams: { q: string };
      }>()({
        endpoint: "/search",
        method: "GET",
      })
      .setQueryParams({ q: "hello world&foo=bar" });

    const { data, error } = await request.send();

    expect(error).toBeNull();
    expect(data!.params.q).toBe("hello world&foo=bar");
  });
});

describe("E2E [ URL Params ]", () => {
  it("should resolve single URL param", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: { id: number; name: string } }>()({
      endpoint: "/users/:id",
      method: "GET",
    });

    const { data, error } = await request.setParams({ id: "1" }).send();

    expect(error).toBeNull();
    expect(data).toStrictEqual({ id: 1, name: "Alice" });
  });

  it("should resolve multiple URL params", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: { org: string; repo: string } }>()({
      endpoint: "/orgs/:orgId/repos/:repoId",
      method: "GET",
    });

    const { data, error } = await request.setParams({ orgId: "acme", repoId: "hyper-fetch" }).send();

    expect(error).toBeNull();
    expect(data).toStrictEqual({ org: "acme", repo: "hyper-fetch" });
  });
});

describe("E2E [ Redirects ]", () => {
  it("should follow 302 redirect", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: { redirected: boolean } }>()({
      endpoint: "/redirect-302",
      method: "GET",
    });

    const { data, error, status } = await request.send();

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data).toStrictEqual({ redirected: true });
  });

  it("should follow 301 redirect", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: { redirected: boolean } }>()({
      endpoint: "/redirect-301",
      method: "GET",
    });

    const { data, error, status } = await request.send();

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data).toStrictEqual({ redirected: true });
  });

  it("should follow redirect chain", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: { redirected: boolean } }>()({
      endpoint: "/redirect-chain",
      method: "GET",
    });

    const { data, error, status } = await request.send();

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data).toStrictEqual({ redirected: true });
  });
});

describe("E2E [ Streaming ]", () => {
  it("should receive streamed response", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: any }>()({
      endpoint: "/stream",
      method: "GET",
    });

    const { data, error, status } = await request.send();

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data).toBe("chunk1chunk2chunk3");
  });

  it("should report download progress for streamed response", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: any }>()({
      endpoint: "/stream-large",
      method: "GET",
    });

    const progressEvents: number[] = [];

    const { data, error, status } = await request.send({
      onDownloadProgress: ({ loaded }) => {
        progressEvents.push(loaded);
      },
    });

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data).toBeDefined();
    expect(progressEvents.length).toBeGreaterThanOrEqual(1);
    const lastLoaded = progressEvents[progressEvents.length - 1];
    expect(lastLoaded).toBeGreaterThan(0);
  });
});

describe("E2E [ File Download ]", () => {
  it("should download text file", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: any }>()({
      endpoint: "/download/test.txt",
      method: "GET",
    });

    const { data, error, status, extra } = await request.send();

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(extra!.headers["content-disposition"]).toContain("test.txt");
    expect(data).toBe("Hello, this is a test file content!");
  });

  it("should download binary file with correct size", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: any }>()({
      endpoint: "/download/binary.bin",
      method: "GET",
    });

    const { error, status, extra } = await request.send();

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(extra!.headers["content-length"]).toBe("1024");
    expect(extra!.headers["content-disposition"]).toContain("binary.bin");
  });
});

describe("E2E [ Concurrent Requests ]", () => {
  it("should handle multiple concurrent requests", async () => {
    const client = new Client({ url: baseUrl });

    const requests = [1, 2, 3].map((id) =>
      client
        .createRequest<{ response: { id: number } }>()({
          endpoint: `/item/${id}`,
          method: "GET",
        })
        .send(),
    );

    const results = await Promise.all(requests);

    results.forEach((result, index) => {
      expect(result.error).toBeNull();
      expect(result.status).toBe(200);
      expect(result.data).toStrictEqual({ id: index + 1 });
    });
  });
});

describe("E2E [ Request Callbacks ]", () => {
  it("should fire lifecycle callbacks in order", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{
      response: { body: { test: boolean } };
      payload: { test: boolean };
    }>()({
      endpoint: "/callback-test",
      method: "POST",
    });

    const callOrder: string[] = [];

    await request.send({
      payload: { test: true },
      onRequestStart: () => {
        callOrder.push("requestStart");
      },
      onResponse: () => {
        callOrder.push("response");
      },
    });

    expect(callOrder).toContain("requestStart");
    expect(callOrder).toContain("response");
    expect(callOrder.indexOf("requestStart")).toBeLessThan(callOrder.indexOf("response"));
  });
});

describe("E2E [ Error Responses ]", () => {
  it("should return structured validation error", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{
      response: { success: boolean };
      payload: { email?: string };
      error: { errors: { email: string } };
    }>()({
      endpoint: "/validate",
      method: "POST",
    });

    const { data, error, status } = await request.send({ payload: {} });

    expect(data).toBeNull();
    expect(status).toBe(422);
    expect(error).toStrictEqual({ errors: { email: "Email is required" } });
  });

  it("should return success when payload is valid", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{
      response: { success: boolean };
      payload: { email: string };
    }>()({
      endpoint: "/validate",
      method: "POST",
    });

    const { data, error, status } = await request.send({ payload: { email: "test@example.com" } });

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data).toStrictEqual({ success: true });
  });
});

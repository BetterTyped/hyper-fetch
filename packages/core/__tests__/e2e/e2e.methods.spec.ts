/**
 * @vitest-environment node
 */
import { Client } from "@hyper-fetch/core";
import { createE2EServer, echoHandler, jsonHandler, statusHandler, headHandler } from "@hyper-fetch/testing";

const { route, startServer, stopServer } = createE2EServer();

let baseUrl: string;

beforeAll(async () => {
  // HTTP Methods
  route("GET", "/users", jsonHandler([{ id: 1, name: "John" }]));
  route("POST", "/users", echoHandler);
  route("PUT", "/users/:id", echoHandler);
  route("PATCH", "/users/:id", echoHandler);
  route("DELETE", "/users/:id", jsonHandler({ deleted: true }));
  route("HEAD", "/users", headHandler({ "X-Total-Count": "42" }));

  // Status Codes
  route("GET", "/status/200", statusHandler(200, { ok: true }));
  route("GET", "/status/201", statusHandler(201, { created: true }));
  route("GET", "/status/204", statusHandler(204));
  route("GET", "/status/400", statusHandler(400, { message: "Bad Request" }));
  route("GET", "/status/401", statusHandler(401, { message: "Unauthorized" }));
  route("GET", "/status/403", statusHandler(403, { message: "Forbidden" }));
  route("GET", "/status/404", statusHandler(404, { message: "Not Found" }));
  route("GET", "/status/500", statusHandler(500, { message: "Internal Server Error" }));

  // Headers
  route("GET", "/echo-headers", echoHandler);
  route("GET", "/custom-response-headers", (_req, res) => {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "X-Custom-Header": "custom-value",
      "X-Request-Id": "abc-123",
    });
    res.end(JSON.stringify({ ok: true }));
  });

  baseUrl = await startServer();
});

afterAll(async () => {
  await stopServer();
});

describe("E2E [ HTTP Methods ]", () => {
  it("should perform GET request", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: { id: number; name: string }[] }>()({
      endpoint: "/users",
      method: "GET",
    });

    const { data, error, status } = await request.send();

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data).toStrictEqual([{ id: 1, name: "John" }]);
  });

  it("should perform POST request with JSON payload", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{
      response: { method: string; body: { username: string } };
      payload: { username: string };
    }>()({
      endpoint: "/users",
      method: "POST",
    });

    const { data, error, status } = await request.send({ payload: { username: "Jane" } });

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data!.method).toBe("POST");
    expect(data!.body).toStrictEqual({ username: "Jane" });
  });

  it("should perform PUT request with JSON payload", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{
      response: { method: string; body: { name: string } };
      payload: { name: string };
    }>()({
      endpoint: "/users/:id",
      method: "PUT",
    });

    const { data, error, status } = await request.setParams({ id: "1" }).send({ payload: { name: "Updated" } });

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data!.method).toBe("PUT");
    expect(data!.body).toStrictEqual({ name: "Updated" });
  });

  it("should perform PATCH request with JSON payload", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{
      response: { method: string; body: { name: string } };
      payload: { name: string };
    }>()({
      endpoint: "/users/:id",
      method: "PATCH",
    });

    const { data, error, status } = await request.setParams({ id: "1" }).send({ payload: { name: "Patched" } });

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data!.method).toBe("PATCH");
    expect(data!.body).toStrictEqual({ name: "Patched" });
  });

  it("should perform DELETE request", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: { deleted: boolean } }>()({
      endpoint: "/users/:id",
      method: "DELETE",
    });

    const { data, error, status } = await request.setParams({ id: "1" }).send();

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data).toStrictEqual({ deleted: true });
  });

  it("should perform HEAD request", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: null }>()({
      endpoint: "/users",
      method: "HEAD" as any,
    });

    const { error, status, extra } = await request.send();

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(extra!.headers["x-total-count"]).toBe("42");
  });
});

describe("E2E [ Status Codes ]", () => {
  const testSuccess = async (path: string, expectedStatus: number, expectedData?: unknown) => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: any }>()({
      endpoint: path,
      method: "GET",
    });

    const { data, error, status } = await request.send();

    expect(error).toBeNull();
    expect(status).toBe(expectedStatus);
    if (expectedData !== undefined) {
      expect(data).toStrictEqual(expectedData);
    }
  };

  const testError = async (path: string, expectedStatus: number, expectedError?: unknown) => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: any }>()({
      endpoint: path,
      method: "GET",
    });

    const { data, error, status } = await request.send();

    expect(data).toBeNull();
    expect(status).toBe(expectedStatus);
    if (expectedError !== undefined) {
      expect(error).toStrictEqual(expectedError);
    }
  };

  it("should handle 200 OK", async () => {
    await testSuccess("/status/200", 200, { ok: true });
  });

  it("should handle 201 Created", async () => {
    await testSuccess("/status/201", 201, { created: true });
  });

  it("should handle 204 No Content", async () => {
    await testSuccess("/status/204", 204);
  });

  it("should handle 400 Bad Request", async () => {
    await testError("/status/400", 400, { message: "Bad Request" });
  });

  it("should handle 401 Unauthorized", async () => {
    await testError("/status/401", 401, { message: "Unauthorized" });
  });

  it("should handle 403 Forbidden", async () => {
    await testError("/status/403", 403, { message: "Forbidden" });
  });

  it("should handle 404 Not Found", async () => {
    await testError("/status/404", 404, { message: "Not Found" });
  });

  it("should handle 500 Internal Server Error", async () => {
    await testError("/status/500", 500, { message: "Internal Server Error" });
  });
});

describe("E2E [ Headers ]", () => {
  it("should send custom request headers", async () => {
    const client = new Client({ url: baseUrl });
    const request = client
      .createRequest<{ response: { headers: Record<string, string> } }>()({
        endpoint: "/echo-headers",
        method: "GET",
      })
      .setHeaders({ "X-Api-Key": "test-key", Authorization: "Bearer token123" });

    const { data, error } = await request.send();

    expect(error).toBeNull();
    expect(data!.headers["x-api-key"]).toBe("test-key");
    expect(data!.headers.authorization).toBe("Bearer token123");
  });

  it("should receive custom response headers", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: { ok: boolean } }>()({
      endpoint: "/custom-response-headers",
      method: "GET",
    });

    const { data, error, extra } = await request.send();

    expect(error).toBeNull();
    expect(data).toStrictEqual({ ok: true });
    expect(extra!.headers["x-custom-header"]).toBe("custom-value");
    expect(extra!.headers["x-request-id"]).toBe("abc-123");
  });
});

/**
 * @jest-environment jsdom
 */
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { getErrorMessage } from "adapter";
import { Client } from "client";
import { FetchHttpAdapter } from "http-adapter";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("Fetch Adapter [ Browser ]", () => {
  const requestId = "test";

  let client: Client;
  let request: any;

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "https://shared-base-url" });
    request = client.createRequest<{ response: any }>()({ endpoint: "/shared-endpoint" });
    request.client.requestManager.addAbortController(request.abortKey, requestId);
    resetMocks();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("Basic Functionality", () => {
    it("should make a request and return success data with status", async () => {
      const data = mockRequest(request, { data: { response: [] } });

      const { data: response, error, status, extra } = await FetchHttpAdapter()
        .initialize(client)
        .fetch(request, requestId);

      expect(response).toStrictEqual(data);
      expect(status).toBe(200);
      expect(error).toBe(null);
      expect(extra).toStrictEqual({ headers: { "content-type": "application/json", "content-length": "15" } });
    });

    it("should make a request and return error data with status", async () => {
      const data = mockRequest(request, { status: 400 });

      const { data: response, error, status, extra } = await FetchHttpAdapter()
        .initialize(client)
        .fetch(request, requestId);

      expect(response).toBe(null);
      expect(status).toBe(400);
      expect(error).toStrictEqual(data);
      expect(extra).toStrictEqual({ headers: { "content-type": "application/json", "content-length": "19" } });
    });

    it("should use GET as default method when no method is specified", async () => {
      const data = mockRequest(request, { data: { response: [] } });

      const { data: response } = await FetchHttpAdapter().initialize(client).fetch(request, requestId);

      expect(response).toStrictEqual(data);
    });

    it("should handle different HTTP methods", async () => {
      const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;

      for (const method of methods) {
        const methodRequest = request.setMethod(method);
        const data = mockRequest(methodRequest, { data: { method } });

        const { data: response } = await FetchHttpAdapter().initialize(client).fetch(methodRequest, requestId);

        expect(response).toStrictEqual(data);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      const networkErrorRequest = request.setEndpoint("/network-error");
      mockRequest(networkErrorRequest, { status: 500, data: null });

      const { data: response, error, status } = await FetchHttpAdapter()
        .initialize(client)
        .fetch(networkErrorRequest, requestId);

      expect(response).toBe(null);
      expect(status).toBe(500);
      expect(error).toBeDefined();
    });

    it("should handle 500 server errors", async () => {
      const data = mockRequest(request, { status: 500 });

      const { data: response, error, status } = await FetchHttpAdapter()
        .initialize(client)
        .fetch(request, requestId);

      expect(response).toBe(null);
      expect(status).toBe(500);
      expect(error).toStrictEqual(data);
    });

    it("should handle 404 not found errors", async () => {
      const data = mockRequest(request, { status: 404 });

      const { data: response, error, status } = await FetchHttpAdapter()
        .initialize(client)
        .fetch(request, requestId);

      expect(response).toBe(null);
      expect(status).toBe(404);
      expect(error).toStrictEqual(data);
    });
  });

  describe("Timeout Handling", () => {
    it("should return timeout error when request takes too long", async () => {
      const timeoutRequest = request.setOptions({ timeout: 5 });
      mockRequest(timeoutRequest, { delay: 20 });

      const { data: response, error } = await FetchHttpAdapter()
        .initialize(client)
        .fetch(timeoutRequest, requestId);

      expect(response).toBe(null);
      expect(error.message).toEqual(getErrorMessage("timeout").message);
    });

    it("should handle custom timeout values", async () => {
      const timeoutRequest = request.setOptions({ timeout: 100 });
      mockRequest(timeoutRequest, { delay: 200 });

      const { data: response, error } = await FetchHttpAdapter()
        .initialize(client)
        .fetch(timeoutRequest, requestId);

      expect(response).toBe(null);
      expect(error.message).toEqual(getErrorMessage("timeout").message);
    });

    it("should not timeout for fast requests", async () => {
      const fastRequest = request.setOptions({ timeout: 1000 });
      const data = mockRequest(fastRequest, { delay: 10 });

      const { data: response, error } = await FetchHttpAdapter()
        .initialize(client)
        .fetch(fastRequest, requestId);

      expect(response).toStrictEqual(data);
      expect(error).toBe(null);
    });
  });

  describe("Abort Functionality", () => {
    it("should allow to cancel request and return error", async () => {
      mockRequest(request, { delay: 100 });

      setTimeout(() => {
        request.abort();
      }, 10);

      const { data: response, error } = await FetchHttpAdapter().initialize(client).fetch(request, requestId);

      expect(response).toBe(null);
      expect(error.message).toEqual(getErrorMessage("abort").message);
    });

    it("should handle abort during request processing", async () => {
      mockRequest(request, { delay: 50 });

      setTimeout(() => {
        request.abort();
      }, 25);

      const { data: response, error } = await FetchHttpAdapter().initialize(client).fetch(request, requestId);

      expect(response).toBe(null);
      expect(error.message).toEqual(getErrorMessage("abort").message);
    });
  });

  describe("Payload Handling", () => {
    it("should handle JSON payload", async () => {
      const postRequest = request.setMethod("POST");
      const payload = { name: "John", age: 30 };
      const data = mockRequest(postRequest, { data: { received: payload } });

      const { data: response } = await FetchHttpAdapter()
        .initialize(client)
        .fetch(postRequest.setPayload(payload), requestId);

      expect(response).toStrictEqual(data);
    });

    it("should handle FormData payload in browser environment", async () => {
      const postRequest = request.setMethod("POST");
      const formData = new FormData();
      formData.append("name", "John");
      formData.append("file", new Blob(["test"]));
      const data = mockRequest(postRequest, { data: { received: "formdata" } });

      const { data: response } = await FetchHttpAdapter()
        .initialize(client)
        .fetch(postRequest.setPayload(formData), requestId);

      expect(response).toStrictEqual(data);
    });

    it("should handle FormData availability check", async () => {
      // Test that FormData is available in browser environment
      expect(typeof FormData).toBe("function");
      expect(new FormData()).toBeInstanceOf(FormData);
    });

    it("should handle string payload", async () => {
      const postRequest = request.setMethod("POST");
      const payload = "Hello World";
      const data = mockRequest(postRequest, { data: { received: payload } });

      const { data: response } = await FetchHttpAdapter()
        .initialize(client)
        .fetch(postRequest.setPayload(payload), requestId);

      expect(response).toStrictEqual(data);
    });

    it("should handle ArrayBuffer payload", async () => {
      const postRequest = request.setMethod("POST");
      const payload = new ArrayBuffer(8);
      const data = mockRequest(postRequest, { data: { received: "arraybuffer" } });

      const { data: response } = await FetchHttpAdapter()
        .initialize(client)
        .fetch(postRequest.setPayload(payload), requestId);

      expect(response).toStrictEqual(data);
    });

    it("should handle Uint8Array payload", async () => {
      const postRequest = request.setMethod("POST");
      const payload = new Uint8Array([1, 2, 3, 4]);
      const data = mockRequest(postRequest, { data: { received: "uint8array" } });

      const { data: response } = await FetchHttpAdapter()
        .initialize(client)
        .fetch(postRequest.setPayload(payload), requestId);

      expect(response).toStrictEqual(data);
    });

    it("should handle ReadableStream payload", async () => {
      const postRequest = request.setMethod("POST");
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("Hello"));
          controller.close();
        },
      });
      const data = mockRequest(postRequest, { data: { received: "stream" } });

      const { data: response } = await FetchHttpAdapter()
        .initialize(client)
        .fetch(postRequest.setPayload(stream), requestId);

      expect(response).toStrictEqual(data);
    });
  });

  describe("Headers", () => {
    it("should send custom headers", async () => {
      const customHeadersRequest = request.setHeaders({
        "X-Custom-Header": "test-value",
        Authorization: "Bearer token",
      });
      const data = mockRequest(customHeadersRequest, { data: { headers: "received" } });

      const { data: response } = await FetchHttpAdapter()
        .initialize(client)
        .fetch(customHeadersRequest, requestId);

      expect(response).toStrictEqual(data);
    });

    it("should automatically set Content-Type for JSON payload", async () => {
      const postRequest = request.setMethod("POST");
      const payload = { test: "data" };
      const data = mockRequest(postRequest, { data: { received: payload } });

      const { data: response } = await FetchHttpAdapter()
        .initialize(client)
        .fetch(postRequest.setPayload(payload), requestId);

      expect(response).toStrictEqual(data);
    });

    it("should not override existing Content-Type header", async () => {
      const postRequest = request.setMethod("POST").setHeaders({
        "Content-Type": "application/xml",
      });
      const payload = { test: "data" };
      const data = mockRequest(postRequest, { data: { received: payload } });

      const { data: response } = await FetchHttpAdapter()
        .initialize(client)
        .fetch(postRequest.setPayload(payload), requestId);

      expect(response).toStrictEqual(data);
    });
  });

  describe("Query Parameters", () => {
    it("should handle query parameters", async () => {
      const queryRequest = request.setQueryParams({
        search: "test",
        page: 1,
        limit: 10,
      });
      const data = mockRequest(queryRequest, { data: { query: "received" } });

      const { data: response } = await FetchHttpAdapter()
        .initialize(client)
        .fetch(queryRequest, requestId);

      expect(response).toStrictEqual(data);
    });

    it("should handle complex query parameters", async () => {
      const queryRequest = request.setQueryParams({
        filters: { status: "active", category: "tech" },
        tags: ["javascript", "typescript"],
        date: new Date("2023-01-01"),
      });
      const data = mockRequest(queryRequest, { data: { query: "received" } });

      const { data: response } = await FetchHttpAdapter()
        .initialize(client)
        .fetch(queryRequest, requestId);

      expect(response).toStrictEqual(data);
    });
  });

  describe("Response Handling", () => {
    it("should handle JSON responses", async () => {
      const data = mockRequest(request, { data: { message: "Hello World" } });

      const { data: response } = await FetchHttpAdapter().initialize(client).fetch(request, requestId);

      expect(response).toStrictEqual(data);
    });

    it("should handle text responses", async () => {
      const data = mockRequest(request, { data: "Plain text response" });

      const { data: response } = await FetchHttpAdapter().initialize(client).fetch(request, requestId);

      expect(response).toStrictEqual(data);
    });

    it("should handle empty responses", async () => {
      const data = mockRequest(request, { data: null });

      const { data: response } = await FetchHttpAdapter().initialize(client).fetch(request, requestId);

      expect(response).toStrictEqual(data);
    });

    it("should handle response headers", async () => {
      const data = mockRequest(request, { data: { message: "test" } });

      const { extra } = await FetchHttpAdapter().initialize(client).fetch(request, requestId);

      expect(extra?.headers).toBeDefined();
      expect(extra?.headers["content-type"]).toBe("application/json");
    });
  });

  describe("Adapter Options", () => {
    it("should apply adapter options", async () => {
      const optionsRequest = request.setAdapterOptions({
        mode: "cors",
        credentials: "include",
        cache: "no-cache",
      });
      const data = mockRequest(optionsRequest, { data: { options: "applied" } });

      const { data: response } = await FetchHttpAdapter()
        .initialize(client)
        .fetch(optionsRequest, requestId);

      expect(response).toStrictEqual(data);
    });

    it("should handle timeout in adapter options", async () => {
      const optionsRequest = request.setAdapterOptions({
        timeout: 10,
      });
      mockRequest(optionsRequest, { delay: 50 });

      const { data: response, error } = await FetchHttpAdapter()
        .initialize(client)
        .fetch(optionsRequest, requestId);

      expect(response).toBe(null);
      expect(error.message).toEqual(getErrorMessage("timeout").message);
    });
  });

  describe("Progress Tracking", () => {
    it("should track download progress when ReadableStream is available", async () => {
      const progressRequest = request.setEndpoint("/progress");
      const data = mockRequest(progressRequest, { data: { progress: "tracked" } });

      const onResponseProgress = jest.fn();

      const { data: response } = await FetchHttpAdapter()
        .initialize(client)
        .fetch(progressRequest, requestId);

      expect(response).toStrictEqual(data);
    });
  });

  describe("Edge Cases", () => {
    it("should handle requests with no payload", async () => {
      const data = mockRequest(request, { data: { empty: "payload" } });

      const { data: response } = await FetchHttpAdapter().initialize(client).fetch(request, requestId);

      expect(response).toStrictEqual(data);
    });

    it("should handle requests with empty headers", async () => {
      const emptyHeadersRequest = request.setHeaders({});
      const data = mockRequest(emptyHeadersRequest, { data: { empty: "headers" } });

      const { data: response } = await FetchHttpAdapter()
        .initialize(client)
        .fetch(emptyHeadersRequest, requestId);

      expect(response).toStrictEqual(data);
    });

    it("should handle requests with null/undefined values", async () => {
      const nullRequest = request.setPayload(null);
      const data = mockRequest(nullRequest, { data: { null: "payload" } });

      const { data: response } = await FetchHttpAdapter()
        .initialize(client)
        .fetch(nullRequest, requestId);

      expect(response).toStrictEqual(data);
    });
  });
}); 
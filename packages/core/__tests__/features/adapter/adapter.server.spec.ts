/**
 * @vitest-environment node
 */
import type { Mock } from "vitest";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { getErrorMessage } from "adapter";
import { Client } from "client";
import { HttpAdapter } from "http-adapter";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("Http Adapter [ Fetch ]", () => {
  const requestId = "test";
  const abortKey = "abort-key";

  let client = new Client({ url: "http://shared-base-url" });
  let request = client.createRequest<{ response: any }>()({ endpoint: "/shared-endpoint", abortKey });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "http://shared-base-url" });
    client.appManager.isBrowser = false;

    request = client.createRequest<{ response: any }>()({ endpoint: "/shared-endpoint", abortKey });

    client.requestManager.addAbortController(abortKey, requestId);

    resetMocks();
    vi.resetAllMocks();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should pick correct adapter and not throw", async () => {
    mockRequest(request);
    client.appManager.isBrowser = true;
    await expect(() => HttpAdapter().initialize(client).fetch(request, requestId)).not.toThrow();
  });

  it("should make a request and return success data with status", async () => {
    const data = mockRequest(request, { data: { response: [] } });

    const { data: response, error, status, extra } = await HttpAdapter().initialize(client).fetch(request, requestId);

    expect(response).toStrictEqual(data);
    expect(status).toBe(200);
    expect(error).toBe(null);
    expect(extra).toEqual({ headers: { "content-type": "application/json", "content-length": "15" } });
  });

  it("should make a request and return error data with status", async () => {
    const data = mockRequest(request, { status: 400 });

    const { data: response, error, status, extra } = await HttpAdapter().initialize(client).fetch(request, requestId);

    expect(response).toBe(null);
    expect(status).toBe(400);
    expect(error).toStrictEqual(data);
    expect(extra).toEqual({ headers: { "content-type": "application/json", "content-length": "19" } });
  });

  it("should allow to cancel request and return error", async () => {
    mockRequest(request, { delay: 5 });

    const id = setTimeout(() => {
      request.abort();
    }, 2);

    const { data: response, error } = await HttpAdapter().initialize(client).fetch(request, requestId);

    expect(response).toBe(null);
    expect(error.message).toEqual(getErrorMessage("abort").message);

    clearTimeout(id);
  });

  it("should return timeout error when request takes too long", async () => {
    const timeoutRequest = request.setOptions({ timeout: 10 });
    mockRequest(timeoutRequest, { delay: 20 });

    const { data: response, error } = await HttpAdapter().initialize(client).fetch(timeoutRequest, requestId);

    expect(response).toBe(null);
    expect(error.message).toEqual(getErrorMessage("timeout").message);
  });

  it("should allow to make post request with json data", async () => {
    const payload = {
      testData: "123",
    };
    const postRequest = client
      .createRequest<{
        response: null;
        payload: { testData: string };
      }>()({ endpoint: "shared-endpoint", method: "POST" })
      .setPayload(payload);
    client.requestManager.addAbortController(postRequest.abortKey, requestId);
    const mock = mockRequest(postRequest);

    const {
      data: response,
      error,
      status,
      extra,
    } = await HttpAdapter().initialize(client).fetch(postRequest, requestId);

    expect(response).toEqual(mock);
    expect(error).toBeNull();
    expect(status).toEqual(200);
    expect(extra).toEqual({ headers: { "content-type": "application/json", "content-length": "2" } });
  });

  it("should send payload with object data", async () => {
    const mutation = client.createRequest<{ response: any; payload: any }>()({
      endpoint: "/shared-endpoint",
      method: "POST",
    });
    client.requestManager.addAbortController(mutation.abortKey, requestId);
    mockRequest(mutation);

    const { error, status } = await mutation.send({
      payload: {
        username: "Kacper",
        password: "Kacper1234",
      },
    });

    expect(error).toBeNull();
    expect(status).toBe(200);
  });

  it("should send payload with string data", async () => {
    const mutation = client.createRequest<{ response: any; payload: any }>()({
      endpoint: "/shared-endpoint",
      method: "POST",
    });
    client.requestManager.addAbortController(mutation.abortKey, requestId);
    mockRequest(mutation);

    const { error, status } = await mutation.send({
      payload: "raw-string-payload",
    });

    expect(error).toBeNull();
    expect(status).toBe(200);
  });

  describe("When streaming mode is enabled", () => {
    it("should return response.body for successful streaming response", async () => {
      mockRequest(request, { data: { response: "stream" } });

      const streamRequest = request.setOptions({ streaming: true });

      const result = await HttpAdapter().initialize(client).fetch(streamRequest, requestId);

      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();
    });

    it("should return error for failed streaming response", async () => {
      mockRequest(request, { status: 400, data: { error: "stream-fail" } });

      const streamRequest = request.setOptions({ streaming: true });

      const result = await HttpAdapter().initialize(client).fetch(streamRequest, requestId);

      expect(result.status).toBe(400);
      expect(result.data).toBe(null);
      expect(result.error).toBeDefined();
    });
  });

  describe("When response.body has no getReader", () => {
    it("should fall back to response.text()", async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        body: null,
        text: vi.fn().mockResolvedValue(JSON.stringify({ fallback: true })),
      });

      try {
        const adapter = HttpAdapter().initialize(client);
        const result = await adapter.fetch(request, requestId);

        expect(result.status).toBe(200);
        expect(result.data).toStrictEqual({ fallback: true });
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe("When non-timeout, non-abort error occurs", () => {
    it("should call onError with the error", async () => {
      const originalFetch = globalThis.fetch;
      const testError = new Error("Network failure");
      globalThis.fetch = vi.fn().mockRejectedValue(testError);

      try {
        const adapter = HttpAdapter().initialize(client);
        const result = await adapter.fetch(request, requestId);

        expect(result.data).toBe(null);
        expect(result.error).toBe(testError);
        expect(result.status).toBe(0);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe("When sending non-string payload with POST method", () => {
    it("should handle non-string body without triggering string upload progress", async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/octet-stream" }),
        body: null,
        text: vi.fn().mockResolvedValue("ok"),
      });

      try {
        const mutation = client.createRequest<{ response: any; payload: any }>()({
          endpoint: "/shared-endpoint",
          method: "POST",
          abortKey,
        });

        const bufPayload = Buffer.from("binary data");
        client.adapter.setPayloadMapper(() => bufPayload as any);
        const req = mutation.setPayload("ignored");

        const result = await client.adapter.fetch(req, requestId);

        const fetchCall = (globalThis.fetch as unknown as Mock).mock.calls[0][1];
        expect(fetchCall.body).toBe(bufPayload);
        expect(result.status).toBe(200);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe("When response has content-length header in streaming reader path", () => {
    it("should use content-length for progress total when available", async () => {
      const originalFetch = globalThis.fetch;
      const bodyContent = JSON.stringify({ data: "test" });
      const encoder = new TextEncoder();
      const encoded = encoder.encode(bodyContent);

      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: encoded })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          "content-type": "application/json",
          "content-length": String(encoded.length),
        }),
        body: { getReader: () => mockReader },
      });

      try {
        const adapter = HttpAdapter().initialize(client);
        const result = await adapter.fetch(request, requestId);

        expect(result.status).toBe(200);
        expect(result.data).toStrictEqual({ data: "test" });
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("should use receivedLength as total when content-length is missing", async () => {
      const originalFetch = globalThis.fetch;
      const bodyContent = JSON.stringify({ noLength: true });
      const encoder = new TextEncoder();
      const encoded = encoder.encode(bodyContent);

      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: encoded })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        body: { getReader: () => mockReader },
      });

      try {
        const adapter = HttpAdapter().initialize(client);
        const result = await adapter.fetch(request, requestId);

        expect(result.status).toBe(200);
        expect(result.data).toStrictEqual({ noLength: true });
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe("When error occurs without timeout set", () => {
    it("should handle catch block when timeoutId is not set", async () => {
      const originalFetch = globalThis.fetch;
      const testError = new Error("Connection refused");
      globalThis.fetch = vi.fn().mockRejectedValue(testError);

      try {
        const noTimeoutRequest = request.setOptions({ timeout: 0 });

        const adapter = HttpAdapter().initialize(client);
        const result = await adapter.fetch(noTimeoutRequest, requestId);

        expect(result.data).toBe(null);
        expect(result.error).toBe(testError);
        expect(result.status).toBe(0);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe("When timeoutMs is 0 or negative", () => {
    it("should skip timeout setup when timeout is 0 and still succeed", async () => {
      const data = mockRequest(request, { data: { response: [] } });

      const zeroTimeoutRequest = request.setOptions({ timeout: 0 });

      const result = await zeroTimeoutRequest.send();

      expect(result.status).toBe(200);
      expect(result.error).toBe(null);
      expect(result.data).toStrictEqual(data);
    });

    it("should skip timeout setup when timeout is negative and still succeed", async () => {
      const data = mockRequest(request, { data: { response: [] } });

      const negativeTimeoutRequest = request.setOptions({ timeout: -1 });

      const result = await negativeTimeoutRequest.send();

      expect(result.status).toBe(200);
      expect(result.error).toBe(null);
      expect(result.data).toStrictEqual(data);
    });
  });
});

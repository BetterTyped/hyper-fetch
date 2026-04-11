import { waitFor } from "@testing-library/dom";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { Client } from "client";
import { xhrExtra } from "http-adapter";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("Request [ retryOnError ]", () => {
  let client = new Client({ url: "shared-base-url" });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    resetMocks();
    vi.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When setting retryOnError via setRetryOnError", () => {
    it("should set the retryOnError callback", () => {
      const request = client.createRequest()({ endpoint: "/users", retry: 2 });
      const callback = () => true;

      expect(request.retryOnError).toBeUndefined();
      const updated = request.setRetryOnError(callback);
      expect(updated.retryOnError).toBeDefined();
    });

    it("should inherit retryOnError through clone", () => {
      const request = client.createRequest()({ endpoint: "/users", retry: 2 });
      const callback = () => true;

      const updated = request.setRetryOnError(callback);
      const cloned = updated.setHeaders({ "x-custom": "test" });

      expect(cloned.retryOnError).toBeDefined();
    });

    it("should not affect original when clone retryOnError is modified", () => {
      const request = client.createRequest()({ endpoint: "/users", retry: 2 });
      const callback = () => true;
      const updated = request.setRetryOnError(callback);
      const cloned = updated.setHeaders({ "x-custom": "test" });
      cloned.retryOnError = () => false;

      expect(updated.retryOnError).toBeDefined();
      expect(updated.retryOnError!(null as any)).toBe(true);
    });

    it("should return a new request instance (immutable)", () => {
      const request = client.createRequest()({ endpoint: "/users", retry: 2 });
      const updated = request.setRetryOnError(() => true);

      expect(updated).not.toBe(request);
      expect(request.retryOnError).toBeUndefined();
    });
  });

  describe("When retryOnError returns true (allow retry)", () => {
    it("should retry the request as normal", async () => {
      const request = client.createRequest()({
        endpoint: "/users",
        retry: 2,
        retryTime: 0,
      });
      mockRequest(request, { status: 400, delay: 0 });

      const retryOnErrorSpy = vi.fn().mockReturnValue(true);
      const retryingRequest = request.setRetryOnError(retryOnErrorSpy);

      const spy = vi.spyOn(client.adapter, "fetch");
      retryingRequest.send();

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(3);
      });

      // Called once per attempt where retry is still available (not on the last exhausted attempt)
      expect(retryOnErrorSpy).toHaveBeenCalledTimes(2);
    });

    it("should call retryOnError with the response object", async () => {
      const request = client.createRequest()({
        endpoint: "/users",
        retry: 1,
        retryTime: 0,
      });
      mockRequest(request, { status: 500, delay: 0 });

      const retryOnErrorSpy = vi.fn().mockReturnValue(true);
      const retryingRequest = request.setRetryOnError(retryOnErrorSpy);

      retryingRequest.send();

      await waitFor(() => {
        expect(retryOnErrorSpy).toHaveBeenCalledTimes(1);
      });

      const firstCallArg = retryOnErrorSpy.mock.calls[0][0];
      expect(firstCallArg).toHaveProperty("error");
      expect(firstCallArg).toHaveProperty("status");
      expect(firstCallArg).toHaveProperty("success", false);
      expect(firstCallArg).toHaveProperty("data");
      expect(firstCallArg.status).toBe(500);
    });
  });

  describe("When retryOnError returns false (stop retry)", () => {
    it("should not retry when retryOnError returns false", async () => {
      const request = client.createRequest()({
        endpoint: "/users",
        retry: 3,
        retryTime: 0,
      });
      mockRequest(request, { status: 404, delay: 0 });

      const retryingRequest = request.setRetryOnError(() => false);

      const spy = vi.spyOn(client.adapter, "fetch");
      retryingRequest.send();

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });

      await new Promise((r) => setTimeout(r, 50));
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("should resolve the send promise immediately when retryOnError returns false", async () => {
      const request = client.createRequest()({
        endpoint: "/users",
        retry: 3,
        retryTime: 0,
      });
      mockRequest(request, { status: 404, delay: 0 });

      const retryingRequest = request.setRetryOnError(() => false);

      const { status, success } = await retryingRequest.send();
      expect(status).toBe(404);
      expect(success).toBe(false);
    });

    it("should stop retrying based on status code (e.g. 404)", async () => {
      const request = client.createRequest()({
        endpoint: "/users",
        retry: 5,
        retryTime: 0,
      });
      mockRequest(request, { status: 404, delay: 0 });

      const retryingRequest = request.setRetryOnError((response) => {
        return response.status !== 404;
      });

      const spy = vi.spyOn(client.adapter, "fetch");
      const result = await retryingRequest.send();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(result.status).toBe(404);
      expect(result.success).toBe(false);
    });

    it("should stop retrying based on error content", async () => {
      const request = client.createRequest()({
        endpoint: "/users",
        retry: 5,
        retryTime: 0,
      });
      mockRequest(request, { status: 403, delay: 0 });

      const retryingRequest = request.setRetryOnError((response) => {
        return response.status !== 403;
      });

      const spy = vi.spyOn(client.adapter, "fetch");
      const result = await retryingRequest.send();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(result.status).toBe(403);
    });
  });

  describe("When retryOnError conditionally allows or disallows retries", () => {
    it("should retry on 500 but not on 404", async () => {
      let callCount = 0;
      const request = client.createRequest()({
        endpoint: "/users",
        retry: 5,
        retryTime: 0,
      });

      const retryOnErrorSpy = vi.fn().mockImplementation((response) => {
        return response.status !== 404;
      });
      const retryingRequest = request.setRetryOnError(retryOnErrorSpy);

      const originalFetch = client.adapter.fetch.bind(client.adapter);
      vi.spyOn(client.adapter, "fetch").mockImplementation(async (...args) => {
        callCount += 1;
        if (callCount === 1) {
          mockRequest(request, { status: 500, delay: 0 });
        } else {
          mockRequest(request, { status: 404, delay: 0 });
        }
        return originalFetch(...args);
      });

      mockRequest(request, { status: 500, delay: 0 });
      const result = await retryingRequest.send();

      expect(result.status).toBe(404);
      expect(result.success).toBe(false);
    });
  });

  describe("When retryOnError is not set", () => {
    it("should retry normally without retryOnError", async () => {
      const request = client.createRequest()({
        endpoint: "/users",
        retry: 2,
        retryTime: 0,
      });
      mockRequest(request, { status: 400, delay: 0 });

      const spy = vi.spyOn(client.adapter, "fetch");
      request.send();

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(3);
      });
    });

    it("should not retry when retry is 0 and no retryOnError", async () => {
      const request = client.createRequest()({
        endpoint: "/users",
        retry: 0,
      });
      mockRequest(request, { status: 400, delay: 0 });

      const spy = vi.spyOn(client.adapter, "fetch");
      request.send();

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("When retryOnError interacts with successful responses", () => {
    it("should not call retryOnError on successful response", async () => {
      const request = client.createRequest()({
        endpoint: "/users",
        retry: 3,
        retryTime: 0,
      });
      mockRequest(request, { status: 200, delay: 0, data: { name: "John" } });

      const retryOnErrorSpy = vi.fn().mockReturnValue(true);
      const retryingRequest = request.setRetryOnError(retryOnErrorSpy);

      const result = await retryingRequest.send();

      expect(result.success).toBe(true);
      expect(retryOnErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe("When retryOnError is used with send() callbacks", () => {
    it("should fire onResponse when retryOnError stops retries", async () => {
      const request = client.createRequest()({
        endpoint: "/users",
        retry: 3,
        retryTime: 0,
      });
      mockRequest(request, { status: 404, delay: 0 });

      const onResponseSpy = vi.fn();
      const retryingRequest = request.setRetryOnError((response) => response.status !== 404);

      await retryingRequest.send({ onResponse: onResponseSpy });

      expect(onResponseSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("When retryOnError is used with $hooks", () => {
    it("should fire $hooks.onResponse when retryOnError stops retries", async () => {
      const request = client.createRequest()({
        endpoint: "/users",
        retry: 3,
        retryTime: 0,
      });
      mockRequest(request, { status: 404, delay: 0 });

      const hookSpy = vi.fn();
      const retryingRequest = request.setRetryOnError((response) => response.status !== 404);
      retryingRequest.$hooks.onResponse(hookSpy);

      await retryingRequest.send();

      expect(hookSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("When using setRetry chained with setRetryOnError", () => {
    it("should respect both retry count and retryOnError", async () => {
      const request = client
        .createRequest()({ endpoint: "/users" })
        .setRetry(3)
        .setRetryTime(0)
        .setRetryOnError(() => true);

      mockRequest(request, { status: 400, delay: 0 });

      const spy = vi.spyOn(client.adapter, "fetch");
      request.send();

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(4);
      });
    });

    it("should stop early when retryOnError returns false mid-retry", async () => {
      let attempt = 0;
      const request = client
        .createRequest()({ endpoint: "/users" })
        .setRetry(5)
        .setRetryTime(0)
        .setRetryOnError(() => {
          attempt += 1;
          return attempt <= 2;
        });

      mockRequest(request, { status: 500, delay: 0 });

      const spy = vi.spyOn(client.adapter, "fetch");
      request.send();

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(3);
      });

      await new Promise((r) => setTimeout(r, 50));
      expect(spy).toHaveBeenCalledTimes(3);
    });
  });
});

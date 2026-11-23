import { createHttpMockingServer } from "@hyper-fetch/testing";
import { getErrorMessage } from "adapter";
import { Client } from "client";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("Request [ exec ]", () => {
  const fixture = { id: 1 };

  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest<{ response: { id: number } }>()({
    endpoint: "/users",
  });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest<{ response: { id: number } }>()({
      endpoint: "/users",
    });
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("when the request lifecycle runs", () => {
    it("should call the lifecycle callbacks given to exec()", async () => {
      mockRequest(request, { data: fixture });
      const onBeforeSent = vi.fn();
      const onRequestStart = vi.fn();
      const onResponseStart = vi.fn();
      const onResponse = vi.fn();

      const response = await request.exec({
        onBeforeSent,
        onRequestStart,
        onResponseStart,
        onResponse,
      });

      expect(response.data).toStrictEqual(fixture);
      expect(onBeforeSent).toHaveBeenCalledOnce();
      expect(onRequestStart).toHaveBeenCalledOnce();
      expect(onResponseStart).toHaveBeenCalledOnce();
      expect(onResponse).toHaveBeenCalledOnce();
      expect(onResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: onBeforeSent.mock.calls[0][0].requestId,
          response: expect.objectContaining({ data: fixture, success: true }),
          details: expect.objectContaining({ isCanceled: false, retries: 0 }),
        }),
      );
    });

    it("should fire the $hooks of the request", async () => {
      mockRequest(request, { data: fixture });
      const onBeforeSent = vi.fn();
      const onRequestStart = vi.fn();
      const onResponseStart = vi.fn();
      const onResponse = vi.fn();
      request.$hooks.onBeforeSent(onBeforeSent);
      request.$hooks.onRequestStart(onRequestStart);
      request.$hooks.onResponseStart(onResponseStart);
      request.$hooks.onResponse(onResponse);

      await request.exec();

      expect(onBeforeSent).toHaveBeenCalledOnce();
      expect(onRequestStart).toHaveBeenCalledOnce();
      expect(onResponseStart).toHaveBeenCalledOnce();
      expect(onResponse).toHaveBeenCalledOnce();
    });

    it("should give onResponse the adapter response and resolve with the mapped one", async () => {
      mockRequest(request, { data: fixture });
      const onResponse = vi.fn();
      const mapped = request.setResponseMapper((res) =>
        res.success ? { ...res, data: { id: res.data.id + 1 } } : res,
      );

      const response = await mapped.exec({ onResponse });

      expect(response.data).toStrictEqual({ id: 2 });
      expect(onResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          response: expect.objectContaining({ data: { id: 1 } }),
        }),
      );
    });
  });

  describe("when the call changes the keys", () => {
    it("should send with the abort key given to the call", async () => {
      mockRequest(request, { data: fixture });

      const response = await request.exec({ abortKey: "custom-abort-key" });

      expect(response.success).toBeTrue();
      expect(response.data).toStrictEqual(fixture);
      expect(client.requestManager.abortControllers.size).toBe(0);
    });

    it("should be aborted by the abort key given to the call", async () => {
      let release = () => {};
      mockRequest(request, {
        data: fixture,
        until: new Promise<void>((resolve) => {
          release = resolve;
        }),
      });

      const executed = request.exec({ abortKey: "custom-abort-key" });
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
      client.requestManager.abortByKey("custom-abort-key");
      release();
      const response = await executed;

      expect(response.success).toBeFalse();
      expect(response.error).toStrictEqual(getErrorMessage("abort"));
    });
  });
});

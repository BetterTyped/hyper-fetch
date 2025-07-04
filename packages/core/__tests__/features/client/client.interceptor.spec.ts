import { createHttpMockingServer } from "@hyper-fetch/testing";

import { interceptorCallback } from "../../utils";
import { testCallbacksExecution } from "../../shared";
import { Client } from "client";
import { xhrExtra } from "http-adapter";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("Client [ Interceptor ]", () => {
  let client = new Client({ url: "shared-base-url/" });
  let request = client.createRequest<{ response: any }>()({ endpoint: "shared-base-endpoint" });

  const spy1 = jest.fn();
  const spy2 = jest.fn();
  const spy3 = jest.fn();

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url/" });
    request = client.createRequest<{ response: any }>()({ endpoint: "shared-base-endpoint" });
    resetMocks();
    jest.clearAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When interceptor callbacks being added", () => {
    it("should assign onError interceptors", async () => {
      const callback = interceptorCallback();
      client.onError(callback).onError(callback);

      expect(client.unstable_onErrorCallbacks).toHaveLength(2);
      expect(client.unstable_onErrorCallbacks[0]).toEqual(callback);
      expect(client.unstable_onErrorCallbacks[1]).toEqual(callback);
    });
    it("should assign onSuccess interceptors", async () => {
      const callback = interceptorCallback();
      client.onSuccess(callback).onSuccess(callback);

      expect(client.unstable_onSuccessCallbacks).toHaveLength(2);
      expect(client.unstable_onSuccessCallbacks[0]).toEqual(callback);
      expect(client.unstable_onSuccessCallbacks[1]).toEqual(callback);
    });
    it("should assign onResponse interceptors", async () => {
      const callback = interceptorCallback();
      client.onResponse(callback).onResponse(callback);

      expect(client.unstable_onResponseCallbacks).toHaveLength(2);
      expect(client.unstable_onResponseCallbacks[0]).toEqual(callback);
      expect(client.unstable_onResponseCallbacks[1]).toEqual(callback);
    });
  });

  describe("When interceptor callbacks go into the execution loop", () => {
    it("should trigger unstable_modifyErrorResponse async loop", async () => {
      const callbackAsync = interceptorCallback({ callback: spy1, sleepTime: 20 });
      const callbackSync = interceptorCallback({ callback: spy2 });
      const callbackLast = interceptorCallback({ callback: spy3, sleepTime: 10 });

      client.onError(callbackAsync).onError(callbackSync).onError(callbackLast);
      await client.unstable_modifyErrorResponse(
        {
          data: null,
          error: null,
          status: 400,
          success: false,
          extra: xhrExtra,
          responseTimestamp: Date.now(),
          requestTimestamp: Date.now(),
        },
        request,
      );

      testCallbacksExecution([spy1, spy2, spy3]);
    });
    it("should trigger __modifySuccessResponse async loop", async () => {
      const callbackAsync = interceptorCallback({ callback: spy1, sleepTime: 20 });
      const callbackSync = interceptorCallback({ callback: spy2 });
      const callbackLast = interceptorCallback({ callback: spy3, sleepTime: 10 });

      client.onSuccess(callbackAsync).onSuccess(callbackSync).onSuccess(callbackLast);
      await client.unstable_modifySuccessResponse(
        {
          data: null,
          error: null,
          status: 400,
          success: false,
          extra: xhrExtra,
          responseTimestamp: Date.now(),
          requestTimestamp: Date.now(),
        },
        request,
      );

      testCallbacksExecution([spy1, spy2, spy3]);
    });
    it("should trigger __modifyResponse async loop", async () => {
      const callbackAsync = interceptorCallback({ callback: spy1, sleepTime: 20 });
      const callbackSync = interceptorCallback({ callback: spy2 });
      const callbackLast = interceptorCallback({ callback: spy3, sleepTime: 10 });

      client.onResponse(callbackAsync).onResponse(callbackSync).onResponse(callbackLast);
      await client.unstable_modifyResponse(
        {
          data: null,
          error: null,
          status: 400,
          success: false,
          extra: xhrExtra,
          requestTimestamp: Date.now(),
          responseTimestamp: Date.now(),
        },
        request,
      );

      testCallbacksExecution([spy1, spy2, spy3]);
    });
  });

  describe("When interceptor returns undefined value", () => {
    it("should throw onError method when request is not returned", async () => {
      client.onError(() => undefined as any);

      await expect(
        client.unstable_modifyErrorResponse(
          {
            data: null,
            error: null,
            status: 400,
            success: false,
            extra: xhrExtra,
            requestTimestamp: Date.now(),
            responseTimestamp: Date.now(),
          },
          request,
        ),
      ).rejects.toThrow();
    });
    it("should throw onSuccess method when request is not returned", async () => {
      client.onSuccess(() => undefined as any);

      await expect(
        client.unstable_modifySuccessResponse(
          {
            data: null,
            error: null,
            status: 400,
            success: false,
            extra: xhrExtra,
            requestTimestamp: Date.now(),
            responseTimestamp: Date.now(),
          },
          request,
        ),
      ).rejects.toThrow();
    });
    it("should throw onResponse method when request is not returned", async () => {
      client.onResponse(() => undefined as any);

      await expect(
        client.unstable_modifyResponse(
          {
            data: null,
            error: null,
            status: 400,
            success: false,
            extra: xhrExtra,
            requestTimestamp: Date.now(),
            responseTimestamp: Date.now(),
          },
          request,
        ),
      ).rejects.toThrow();
    });
  });
  describe("When user wants to remove listeners", () => {
    it("should allow for removing interceptors on error", async () => {
      const firstCallback = interceptorCallback({ callback: spy1 });
      const secondCallback = interceptorCallback({ callback: spy2 });
      client.onError(firstCallback).onError(secondCallback);
      mockRequest(request, { status: 400 });

      await request.send({});
      client.removeOnErrorInterceptors([secondCallback]);
      await request.send({});

      expect(spy1).toHaveBeenCalledTimes(2);
      expect(spy2).toHaveBeenCalledTimes(1);
    });
    it("should allow for removing interceptors on success", async () => {
      mockRequest(request, { data: { data: [1, 2, 3] } });
      const firstCallback = interceptorCallback({ callback: spy1 });
      const secondCallback = interceptorCallback({ callback: spy2 });
      client.onSuccess(firstCallback).onSuccess(secondCallback);

      await request.send({});
      client.removeOnSuccessInterceptors([secondCallback]);

      await request.send({});

      expect(spy1).toHaveBeenCalledTimes(2);
      expect(spy2).toHaveBeenCalledTimes(1);
    });
    it("should allow for removing interceptors on response", async () => {
      const firstCallback = interceptorCallback({ callback: spy1 });
      const secondCallback = interceptorCallback({ callback: spy2 });
      client.onResponse(firstCallback).onResponse(secondCallback);
      mockRequest(request);

      await request.send({});
      client.removeOnResponseInterceptors([secondCallback]);

      await request.send({});

      expect(spy1).toHaveBeenCalledTimes(2);
      expect(spy2).toHaveBeenCalledTimes(1);
    });
  });
});

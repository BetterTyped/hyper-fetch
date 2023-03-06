import { resetInterceptors, startServer, stopServer } from "../../server";
import { createClient, createRequest, interceptorCallback } from "../../utils";
import { testCallbacksExecution } from "../../shared";

describe("Client [ Interceptor ]", () => {
  let client = createClient();
  let request = createRequest(client);

  const spy1 = jest.fn();
  const spy2 = jest.fn();
  const spy3 = jest.fn();

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = createClient();
    request = createRequest(client);
    resetInterceptors();
    jest.clearAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When interceptor callbacks being added", () => {
    it("should assign onError interceptors", async () => {
      const callback = interceptorCallback();
      client.onError(callback).onError(callback);

      expect(client.__onErrorCallbacks).toHaveLength(2);
      expect(client.__onErrorCallbacks[0]).toEqual(callback);
      expect(client.__onErrorCallbacks[1]).toEqual(callback);
    });
    it("should assign onSuccess interceptors", async () => {
      const callback = interceptorCallback();
      client.onSuccess(callback).onSuccess(callback);

      expect(client.__onSuccessCallbacks).toHaveLength(2);
      expect(client.__onSuccessCallbacks[0]).toEqual(callback);
      expect(client.__onSuccessCallbacks[1]).toEqual(callback);
    });
    it("should assign onResponse interceptors", async () => {
      const callback = interceptorCallback();
      client.onResponse(callback).onResponse(callback);

      expect(client.__onResponseCallbacks).toHaveLength(2);
      expect(client.__onResponseCallbacks[0]).toEqual(callback);
      expect(client.__onResponseCallbacks[1]).toEqual(callback);
    });
  });

  describe("When interceptor callbacks go into the execution loop", () => {
    it("should trigger __modifyErrorResponse async loop", async () => {
      const callbackAsync = interceptorCallback({ callback: spy1, sleepTime: 20 });
      const callbackSync = interceptorCallback({ callback: spy2 });
      const callbackLast = interceptorCallback({ callback: spy3, sleepTime: 10 });

      client.onError(callbackAsync).onError(callbackSync).onError(callbackLast);
      await client.__modifyErrorResponse({ data: null, error: null, status: 400 }, request);

      testCallbacksExecution([spy1, spy2, spy3]);
    });
    it("should trigger __modifySuccessResponse async loop", async () => {
      const callbackAsync = interceptorCallback({ callback: spy1, sleepTime: 20 });
      const callbackSync = interceptorCallback({ callback: spy2 });
      const callbackLast = interceptorCallback({ callback: spy3, sleepTime: 10 });

      client.onSuccess(callbackAsync).onSuccess(callbackSync).onSuccess(callbackLast);
      await client.__modifySuccessResponse({ data: null, error: null, status: 400 }, request);

      testCallbacksExecution([spy1, spy2, spy3]);
    });
    it("should trigger __modifyResponse async loop", async () => {
      const callbackAsync = interceptorCallback({ callback: spy1, sleepTime: 20 });
      const callbackSync = interceptorCallback({ callback: spy2 });
      const callbackLast = interceptorCallback({ callback: spy3, sleepTime: 10 });

      client.onResponse(callbackAsync).onResponse(callbackSync).onResponse(callbackLast);
      await client.__modifyResponse({ data: null, error: null, status: 400 }, request);

      testCallbacksExecution([spy1, spy2, spy3]);
    });
  });

  describe("When interceptor returns undefined value", () => {
    it("should throw onError method when request is not returned", async () => {
      client.onError(() => undefined as any);

      await expect(client.__modifyErrorResponse({ data: null, error: null, status: 400 }, request)).rejects.toThrow();
    });
    it("should throw onSuccess method when request is not returned", async () => {
      client.onSuccess(() => undefined as any);

      await expect(client.__modifySuccessResponse({ data: null, error: null, status: 400 }, request)).rejects.toThrow();
    });
    it("should throw onResponse method when request is not returned", async () => {
      client.onResponse(() => undefined as any);

      await expect(client.__modifyResponse({ data: null, error: null, status: 400 }, request)).rejects.toThrow();
    });
  });
});

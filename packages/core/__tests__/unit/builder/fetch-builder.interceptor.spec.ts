import { resetInterceptors, startServer, stopServer } from "../../server";
import { createBuilder, createCommand, interceptorCallback } from "../../utils";
import { testCallbacksExecution } from "../../shared";

describe("FetchBuilder [ Interceptor ]", () => {
  let builder = createBuilder();
  let command = createCommand(builder);

  const spy1 = jest.fn();
  const spy2 = jest.fn();
  const spy3 = jest.fn();

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    builder = createBuilder();
    command = createCommand(builder);
    resetInterceptors();
    jest.clearAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When interceptor callbacks being added", () => {
    it("should assign onError interceptors", async () => {
      const callback = interceptorCallback();
      builder.onError(callback).onError(callback);

      expect(builder.__onErrorCallbacks).toHaveLength(2);
      expect(builder.__onErrorCallbacks[0]).toEqual(callback);
      expect(builder.__onErrorCallbacks[1]).toEqual(callback);
    });
    it("should assign onSuccess interceptors", async () => {
      const callback = interceptorCallback();
      builder.onSuccess(callback).onSuccess(callback);

      expect(builder.__onSuccessCallbacks).toHaveLength(2);
      expect(builder.__onSuccessCallbacks[0]).toEqual(callback);
      expect(builder.__onSuccessCallbacks[1]).toEqual(callback);
    });
    it("should assign onResponse interceptors", async () => {
      const callback = interceptorCallback();
      builder.onResponse(callback).onResponse(callback);

      expect(builder.__onResponseCallbacks).toHaveLength(2);
      expect(builder.__onResponseCallbacks[0]).toEqual(callback);
      expect(builder.__onResponseCallbacks[1]).toEqual(callback);
    });
  });

  describe("When interceptor callbacks go into the execution loop", () => {
    it("should trigger __modifyErrorResponse async loop", async () => {
      const callbackAsync = interceptorCallback({ callback: spy1, sleepTime: 20 });
      const callbackSync = interceptorCallback({ callback: spy2 });
      const callbackLast = interceptorCallback({ callback: spy3, sleepTime: 10 });

      builder.onError(callbackAsync).onError(callbackSync).onError(callbackLast);
      await builder.__modifyErrorResponse([null, null, 400], command);

      testCallbacksExecution([spy1, spy2, spy3]);
    });
    it("should trigger __modifySuccessResponse async loop", async () => {
      const callbackAsync = interceptorCallback({ callback: spy1, sleepTime: 20 });
      const callbackSync = interceptorCallback({ callback: spy2 });
      const callbackLast = interceptorCallback({ callback: spy3, sleepTime: 10 });

      builder.onSuccess(callbackAsync).onSuccess(callbackSync).onSuccess(callbackLast);
      await builder.__modifySuccessResponse([null, null, 400], command);

      testCallbacksExecution([spy1, spy2, spy3]);
    });
    it("should trigger __modifyResponse async loop", async () => {
      const callbackAsync = interceptorCallback({ callback: spy1, sleepTime: 20 });
      const callbackSync = interceptorCallback({ callback: spy2 });
      const callbackLast = interceptorCallback({ callback: spy3, sleepTime: 10 });

      builder.onResponse(callbackAsync).onResponse(callbackSync).onResponse(callbackLast);
      await builder.__modifyResponse([null, null, 400], command);

      testCallbacksExecution([spy1, spy2, spy3]);
    });
  });

  describe("When interceptor returns undefined value", () => {
    it("should throw onError method when command is not returned", async () => {
      builder.onError(() => undefined as any);

      expect(builder.__modifyErrorResponse([null, null, 400], command)).rejects.toThrow();
    });
    it("should throw onSuccess method when command is not returned", async () => {
      builder.onSuccess(() => undefined as any);

      expect(builder.__modifySuccessResponse([null, null, 400], command)).rejects.toThrow();
    });
    it("should throw onResponse method when command is not returned", async () => {
      builder.onResponse(() => undefined as any);

      expect(builder.__modifyResponse([null, null, 400], command)).rejects.toThrow();
    });
  });
});

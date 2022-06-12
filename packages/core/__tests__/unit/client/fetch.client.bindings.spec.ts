import { FetchEffect } from "effect";
import { getClientBindings, ClientDefaultOptionsType, ClientResponseType, getErrorMessage } from "client";
import { resetInterceptors, startServer, stopServer } from "../../server";
import { createBuilder, createCommand, sleep } from "../../utils";
import { testProgressSpy } from "../../shared";

describe("Fetch Client [ Bindings ]", () => {
  const baseUrl = "http://localhost:9000";
  const endpoint = "/endpoint";
  const requestId = "test";
  const queryParams = "?query=params";
  const data = { value: 1 };
  const successResponse: ClientResponseType<unknown, unknown> = [data, null, 200];
  const errorResponse: ClientResponseType<unknown, unknown> = [null, data, 400];
  const requestConfig: ClientDefaultOptionsType = { timeout: 1000 };
  const commandConfig: ClientDefaultOptionsType = { responseType: "arraybuffer" };

  const onTriggerSpy = jest.fn();
  const onErrorSpy = jest.fn();
  const onFinishedSpy = jest.fn();
  const onStartSpy = jest.fn();
  const onSuccessSpy = jest.fn();

  const initializeSetup = () => {
    const effect = new FetchEffect({
      effectKey: "test",
      onTrigger: onTriggerSpy,
      onError: onErrorSpy,
      onFinished: onFinishedSpy,
      onStart: onStartSpy,
      onSuccess: onSuccessSpy,
    });
    const builder = createBuilder({ baseUrl }).setRequestConfig(requestConfig).addEffect([effect]);
    const command = createCommand(builder, { endpoint, options: commandConfig })
      .setData(data)
      .setEffectKey("test")
      .setQueryParams(queryParams);

    return { command, builder, effect };
  };

  let setup = initializeSetup();

  const { builder, command } = setup;

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    setup = initializeSetup();
    resetInterceptors();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("when getClientBindings get initialized", () => {
    it("should create correct fullUrl", async () => {
      const { fullUrl } = await getClientBindings(command, requestId);
      expect(fullUrl).toBe(baseUrl + endpoint + queryParams);
    });

    it("should create correct headers", async () => {
      const { headers } = await getClientBindings(command, requestId);
      expect(headers).toEqual({ "Content-Type": "application/json" });
    });

    it("should create correct payload", async () => {
      const { payload } = await getClientBindings(command, requestId);
      expect(payload).toEqual(JSON.stringify(data));
    });

    it("should create correct request config", async () => {
      const { config } = await getClientBindings(command, requestId);
      expect(config).toEqual({ ...requestConfig, ...commandConfig });
    });

    it("should create AbortController", async () => {
      const { getAbortController } = await getClientBindings(command, requestId);
      expect(getAbortController()).toBeDefined();
    });
  });

  describe("given bindings abort methods being used", () => {
    describe("when using AbortController methods", () => {
      it("should create listener using createAbortListener", async () => {
        const { createAbortListener, getAbortController } = await getClientBindings(command, requestId);
        const spy = jest.fn();
        const controller = getAbortController();
        const unmount = createAbortListener(spy);
        expect(spy).toBeCalledTimes(0);
        controller?.abort();
        expect(spy).toBeCalledTimes(1);
        unmount();
      });

      it("should unmount listener using createAbortListener", async () => {
        const { createAbortListener, getAbortController } = await getClientBindings(command, requestId);
        const spy = jest.fn();
        const controller = getAbortController();
        const unmount = createAbortListener(spy);
        expect(spy).toBeCalledTimes(0);
        unmount();
        controller?.abort();
        expect(spy).toBeCalledTimes(0);
      });

      it("should throw createAbortListener when there is no controller", async () => {
        const { createAbortListener } = await getClientBindings(command, requestId);
        builder.commandManager.abortControllers.clear();
        expect(() => createAbortListener(() => null)).toThrow();
      });
    });
  });

  describe("given bindings pre-request methods being used", () => {
    describe("when onBeforeRequest got executed", () => {
      it("should use effect lifecycle method ", async () => {
        const { onBeforeRequest } = await getClientBindings(command, requestId);
        onBeforeRequest();
        expect(onTriggerSpy).toBeCalledTimes(1);
      });
    });
  });

  // Request
  describe("given bindings request methods being used", () => {
    describe("when onRequestStart got executed", () => {
      it("should use effect lifecycle method", async () => {
        const { onRequestStart } = await getClientBindings(command, requestId);
        onRequestStart();
        expect(onStartSpy).toBeCalledTimes(1);
      });
      it("should emit request start event", async () => {
        const { onRequestStart } = await getClientBindings(command, requestId);
        const spy = jest.fn();
        const unmount = builder.commandManager.events.onRequestStart(command.queueKey, spy);
        onRequestStart();
        unmount();
        expect(spy).toBeCalledTimes(1);
      });
      it("should emit upload progress event", async () => {
        const { onRequestStart } = await getClientBindings(command, requestId);
        const spy = jest.fn();
        const unmount = builder.commandManager.events.onUploadProgress(command.queueKey, spy);
        const startTimestamp = onRequestStart();
        unmount();
        testProgressSpy({ spy, command, requestId, startTimestamp });
      });
      it("should emit upload progress event with specified payload size", async () => {
        const { onRequestStart } = await getClientBindings(command, requestId);
        const progress = {
          total: 9999,
          loaded: 0,
        };

        const spy = jest.fn();
        const unmount = builder.commandManager.events.onUploadProgress(command.queueKey, spy);
        const startTimestamp = onRequestStart(progress);
        unmount();
        testProgressSpy({ ...progress, spy, command, requestId, startTimestamp });
      });
    });
    describe("when onRequestProgress got executed", () => {
      const progress = {
        total: 9999,
        loaded: 30,
      };

      it("should emit upload progress event", async () => {
        const { onRequestStart, onRequestProgress } = await getClientBindings(command, requestId);
        const spy = jest.fn();
        const startTimestamp = onRequestStart();
        await sleep(30);
        const unmount = builder.commandManager.events.onUploadProgress(command.queueKey, spy);
        const progressTimestamp = onRequestProgress(progress);
        unmount();
        testProgressSpy({ ...progress, spy, command, requestId, startTimestamp, progressTimestamp });
      });

      it("should create start timestamp if it's not available", async () => {
        const { onRequestProgress, getRequestStartTimestamp } = await getClientBindings(command, requestId);
        expect(getRequestStartTimestamp()).toBeNull();
        const progressTimestamp = onRequestProgress(progress);
        expect(progressTimestamp).toBeNumber();
      });
    });
    describe("when onRequestEnd got executed", () => {
      const progress = {
        total: 9999,
        loaded: 9999,
      };

      it("should emit upload progress event", async () => {
        const { onRequestStart, onRequestEnd } = await getClientBindings(command, requestId);
        const spy = jest.fn();
        const startTimestamp = onRequestStart({ total: progress.total, loaded: 0 });
        await sleep(30);
        const unmount = builder.commandManager.events.onUploadProgress(command.queueKey, spy);
        const progressTimestamp = onRequestEnd();
        unmount();
        testProgressSpy({ ...progress, spy, command, requestId, startTimestamp, progressTimestamp, timeLeft: 0 });
      });

      it("should create start timestamp if it's not available", async () => {
        const { onRequestEnd, getRequestStartTimestamp } = await getClientBindings(command, requestId);
        expect(getRequestStartTimestamp()).toBeNull();
        const progressTimestamp = onRequestEnd();
        expect(progressTimestamp).toBeNumber();
      });
    });
  });

  // Response
  describe("given bindings response methods being used", () => {
    describe("when onResponseStart got executed", () => {
      it("should emit response start event", async () => {
        const { onResponseStart } = await getClientBindings(command, requestId);
        const spy = jest.fn();
        const unmount = builder.commandManager.events.onResponseStart(command.queueKey, spy);
        onResponseStart();
        unmount();
        expect(spy).toBeCalledTimes(1);
      });
      it("should emit download progress event", async () => {
        const { onResponseStart } = await getClientBindings(command, requestId);
        const spy = jest.fn();
        const unmount = builder.commandManager.events.onDownloadProgress(command.queueKey, spy);
        const startTimestamp = onResponseStart();
        unmount();
        testProgressSpy({ spy, command, requestId, startTimestamp });
      });
      it("should emit download progress event with specified payload size", async () => {
        const { onResponseStart } = await getClientBindings(command, requestId);
        const progress = {
          total: 9999,
          loaded: 0,
        };

        const spy = jest.fn();
        const unmount = builder.commandManager.events.onDownloadProgress(command.queueKey, spy);
        const startTimestamp = onResponseStart(progress);
        unmount();
        testProgressSpy({ ...progress, spy, command, requestId, startTimestamp });
      });
    });
    describe("when onResponseProgress got executed", () => {
      const progress = {
        total: 9999,
        loaded: 30,
      };

      it("should emit upload progress event", async () => {
        const { onResponseStart, onResponseProgress } = await getClientBindings(command, requestId);
        const spy = jest.fn();
        const startTimestamp = onResponseStart();
        await sleep(30);
        const unmount = builder.commandManager.events.onDownloadProgress(command.queueKey, spy);
        const progressTimestamp = onResponseProgress(progress);
        unmount();
        testProgressSpy({ ...progress, spy, command, requestId, startTimestamp, progressTimestamp });
      });

      it("should create start timestamp if it's not available", async () => {
        const { onResponseProgress, getResponseStartTimestamp } = await getClientBindings(command, requestId);
        const startTimestamp = getResponseStartTimestamp();
        expect(startTimestamp).toBeNull();
        const progressTimestamp = onResponseProgress(progress);
        expect(progressTimestamp).toBeNumber();
      });
    });
    describe("when onResponseEnd got executed", () => {
      const progress = {
        total: 9999,
        loaded: 9999,
      };

      it("should emit upload progress event", async () => {
        const { onResponseStart, onResponseEnd } = await getClientBindings(command, requestId);
        const spy = jest.fn();
        const startTimestamp = onResponseStart({ total: progress.total, loaded: 0 });
        await sleep(30);
        const unmount = builder.commandManager.events.onDownloadProgress(command.queueKey, spy);
        const progressTimestamp = onResponseEnd();
        unmount();
        testProgressSpy({ ...progress, spy, command, requestId, startTimestamp, progressTimestamp, timeLeft: 0 });
      });

      it("should create start timestamp if it's not available", async () => {
        const { onResponseEnd, getResponseStartTimestamp } = await getClientBindings(command, requestId);
        const startTimestamp = getResponseStartTimestamp();
        expect(startTimestamp).toBeNull();
        const progressTimestamp = onResponseEnd();
        expect(progressTimestamp).toBeNumber();
      });
    });
  });

  // Data handlers
  describe("given bindings data handling methods being used", () => {
    describe("when onSuccess got executed", () => {
      it("should return success data", async () => {
        const { onSuccess } = await getClientBindings(command, requestId);
        const response = await onSuccess(data, 200);
        expect(response).toEqual(successResponse);
      });
      it("should use effect lifecycle methods", async () => {
        const { onSuccess } = await getClientBindings(command, requestId);
        await onSuccess(data, 200);
        expect(onSuccessSpy).toBeCalledTimes(1);
        expect(onFinishedSpy).toBeCalledTimes(1);
        expect(onSuccessSpy).toBeCalledWith(successResponse, command);
        expect(onFinishedSpy).toBeCalledWith(successResponse, command);
      });
      it("should return data transformed by __modifyResponse", async () => {
        const { onSuccess } = await getClientBindings(command, requestId);
        builder.__onResponseCallbacks.push(() => successResponse);
        const response = await onSuccess(data, 200);
        builder.__onResponseCallbacks = [];
        expect(response).toEqual(successResponse);
      });
      it("should return data transformed by __modifySuccessResponse", async () => {
        const { onSuccess } = await getClientBindings(command, requestId);
        builder.__onSuccessCallbacks.push(() => successResponse);
        const response = await onSuccess(data, 200);
        builder.__onSuccessCallbacks = [];
        expect(response).toEqual(successResponse);
      });
      it("should execute __modifySuccessResponse as last modifier", async () => {
        const { onSuccess } = await getClientBindings(command, requestId);
        const newData: ClientResponseType<unknown, unknown> = ["modified", null, 222];
        builder.__onResponseCallbacks.push(() => errorResponse);
        builder.__onSuccessCallbacks.push(() => newData);
        const response = await onSuccess(data, 200);
        builder.__onResponseCallbacks = [];
        builder.__onSuccessCallbacks = [];
        expect(response).toEqual(newData);
        expect(onSuccessSpy).toBeCalledWith(newData, command);
        expect(onFinishedSpy).toBeCalledWith(newData, command);
      });
    });
    describe("when onError got executed", () => {
      it("should return error data", async () => {
        const { onError } = await getClientBindings(command, requestId);
        const response = await onError(data, 400);
        expect(response).toEqual(errorResponse);
      });
      it("should use effect lifecycle methods", async () => {
        const { onError } = await getClientBindings(command, requestId);
        await onError(data, 400);
        expect(onErrorSpy).toBeCalledTimes(1);
        expect(onFinishedSpy).toBeCalledTimes(1);
        expect(onErrorSpy).toBeCalledWith(errorResponse, command);
        expect(onFinishedSpy).toBeCalledWith(errorResponse, command);
      });
      it("should return data transformed by __modifyResponse", async () => {
        const { onError } = await getClientBindings(command, requestId);
        builder.__onResponseCallbacks.push(() => errorResponse);
        const response = await onError(data, 400);
        builder.__onResponseCallbacks = [];
        expect(response).toEqual(errorResponse);
      });
      it("should return data transformed by __modifyErrorResponse", async () => {
        const { onError } = await getClientBindings(command, requestId);
        builder.__onErrorCallbacks.push(() => errorResponse);
        const response = await onError(data, 400);
        builder.__onErrorCallbacks = [];
        expect(response).toEqual(errorResponse);
      });
      it("should execute __modifyErrorResponse as last modifier", async () => {
        const { onError } = await getClientBindings(command, requestId);
        const newData: ClientResponseType<unknown, unknown> = ["modified", null, 444];
        builder.__onResponseCallbacks.push(() => successResponse);
        builder.__onErrorCallbacks.push(() => newData);
        const response = await onError(data, 400);
        builder.__onErrorCallbacks = [];
        builder.__onResponseCallbacks = [];
        expect(response).toEqual(newData);
        expect(onErrorSpy).toBeCalledWith(newData, command);
        expect(onFinishedSpy).toBeCalledWith(newData, command);
      });
    });
    describe("when errors methods got executed", () => {
      it("should return correct message when onAbortError is executed", async () => {
        const { onAbortError } = await getClientBindings(command, requestId);
        const response = await onAbortError();
        expect(response).toEqual([null, getErrorMessage("abort"), 0]);
      });
      it("should return correct message when onTimeoutError is executed", async () => {
        const { onTimeoutError } = await getClientBindings(command, requestId);
        const response = await onTimeoutError();
        expect(response).toEqual([null, getErrorMessage("timeout"), 0]);
      });
      it("should return correct message when onUnexpectedError is executed", async () => {
        const { onUnexpectedError } = await getClientBindings(command, requestId);
        const response = await onUnexpectedError();
        expect(response).toEqual([null, getErrorMessage(), 0]);
      });
    });
  });
});

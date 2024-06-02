import { RequestEffect } from "effect";
import { xhrExtra, getAdapterBindings, AdapterOptionsType, ResponseType, getErrorMessage, AdapterType } from "adapter";
import { resetInterceptors, startServer, stopServer } from "../../server";
import { sleep } from "../../utils";
import { testProgressSpy } from "../../shared";
import { Client } from "client";
import { RequestInstance } from "request";

describe("Fetch Adapter [ Bindings ]", () => {
  const url = "http://localhost:9000";
  const endpoint = "/endpoint";
  const requestId = "test";
  const queryParams = "?query=params";
  const data = { value: 1 };
  const successResponse: ResponseType<unknown, unknown, AdapterType> = {
    data,
    error: null,
    success: true,
    status: 200,
    extra: xhrExtra,
  };
  const errorResponse: ResponseType<unknown, unknown, AdapterType> = {
    data: null,
    error: data,
    success: false,
    status: 400,
    extra: xhrExtra,
  };
  const requestConfig: AdapterOptionsType = { responseType: "arraybuffer", timeout: 1000 };

  const onTriggerSpy = jest.fn();
  const onErrorSpy = jest.fn();
  const onFinishedSpy = jest.fn();
  const onStartSpy = jest.fn();
  const onSuccessSpy = jest.fn();

  const initializeSetup = () => {
    const effect = new RequestEffect({
      effectKey: "test",
      onTrigger: onTriggerSpy,
      onError: onErrorSpy,
      onFinished: onFinishedSpy,
      onStart: onStartSpy,
      onSuccess: onSuccessSpy,
    });
    const client = new Client({ url }).addEffect([effect]);
    const request = client
      .createRequest<any, { value: number }>()({ endpoint, options: requestConfig })
      .setData(data)
      .setEffectKey("test")
      .setQueryParams(queryParams);

    return { request, client, effect };
  };

  let setup = initializeSetup();

  const { client, request } = setup;

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

  describe("when getAdapterBindings get initialized", () => {
    it("should create correct fullUrl", async () => {
      const { fullUrl } = await getAdapterBindings({
        request,
        requestId,
        systemErrorStatus: 0,
        systemErrorExtra: xhrExtra,
      });
      expect(fullUrl).toBe(url + endpoint + queryParams);
    });

    it("should create correct headers", async () => {
      const { headers } = await getAdapterBindings({
        request,
        requestId,
        systemErrorStatus: 0,
        systemErrorExtra: xhrExtra,
      });
      expect(headers).toEqual({ "Content-Type": "application/json" });
    });

    it("should create correct payload", async () => {
      const { payload } = await getAdapterBindings({
        request,
        requestId,
        systemErrorStatus: 0,
        systemErrorExtra: xhrExtra,
      });
      expect(payload).toEqual(JSON.stringify(data));
    });

    it("should create AbortController", async () => {
      request.client.requestManager.addAbortController(request.abortKey, requestId);
      const { getAbortController } = await getAdapterBindings({
        request,
        requestId,
        systemErrorStatus: 0,
        systemErrorExtra: xhrExtra,
      });
      expect(getAbortController()).toBeDefined();
    });
  });

  describe("given bindings abort methods being used", () => {
    describe("when using AbortController methods", () => {
      it("should create listener using createAbortListener", async () => {
        const { createAbortListener, getAbortController } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: {
            headers: {},
          },
        });
        const spy = jest.fn();
        const resolveSpy = jest.fn();
        request.client.requestManager.addAbortController(request.abortKey, requestId);
        const controller = getAbortController();
        const unmount = createAbortListener(0, xhrExtra, spy, resolveSpy);
        expect(spy).toHaveBeenCalledTimes(0);
        expect(resolveSpy).toHaveBeenCalledTimes(0);
        controller?.abort();
        await sleep(1);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(resolveSpy).toHaveBeenCalledTimes(1);
        unmount();
      });

      it("should unmount listener using createAbortListener", async () => {
        request.client.requestManager.addAbortController(request.abortKey, requestId);
        const { createAbortListener, getAbortController } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: {
            headers: {},
          },
        });
        const spy = jest.fn();
        const resolveSpy = jest.fn();
        const controller = getAbortController();
        const unmount = createAbortListener(0, xhrExtra, spy, resolveSpy);
        expect(spy).toHaveBeenCalledTimes(0);
        expect(resolveSpy).toHaveBeenCalledTimes(0);
        unmount();
        controller?.abort();
        expect(spy).toHaveBeenCalledTimes(0);
        expect(resolveSpy).toHaveBeenCalledTimes(0);
      });

      it("should throw createAbortListener when there is no controller", async () => {
        const { createAbortListener } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        client.requestManager.abortControllers.clear();
        expect(() =>
          createAbortListener(
            0,
            xhrExtra,
            () => null,
            () => null,
          ),
        ).toThrow();
      });
    });
  });

  describe("given bindings pre-request methods being used", () => {
    describe("when onBeforeRequest got executed", () => {
      it("should use effect lifecycle method ", async () => {
        const { onBeforeRequest } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        onBeforeRequest();
        expect(onTriggerSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  // Request
  describe("given bindings request methods being used", () => {
    it("should allow for setting data mapper", async () => {
      const req = client.createRequest<any, Record<string, unknown>, void, { userId: number; role: string }>()({
        endpoint: "shared-endpoint/",
      });
      const spy = jest.fn();
      const newData = {
        userId: 11,
        role: "ADMIN",
      };

      function dataMapper({ role, userId }: { role: string; userId: number }): string {
        spy();
        return `${userId}_${role}`;
      }

      const requestMapped = req.setDataMapper(dataMapper);
      const requestSetData = requestMapped.setData(newData);

      const { payload } = await getAdapterBindings({
        request: requestSetData,
        requestId,
        systemErrorStatus: 0,
        systemErrorExtra: xhrExtra,
      });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(payload).toBe(`${newData.userId}_${newData.role}`);
    });
    it("should allow for setting request mapper", async () => {
      const req = client.createRequest<any, Record<string, unknown>, any, { userId: number; role: string }>()({
        endpoint: "shared-endpoint/",
      });
      const spy = jest.fn();
      const newData = {
        userId: 11,
        role: "ADMIN",
      };

      const requestMapped = req.setRequestMapper<RequestInstance>((r) => {
        spy();
        // TODO figure out something to change type inside of mapper
        return (r as RequestInstance).setData(`${newData.userId}_${newData.role}`);
      });
      const requestSetData = requestMapped.setData(newData);

      const { payload } = await getAdapterBindings({
        request: requestSetData,
        requestId,
        systemErrorStatus: 0,
        systemErrorExtra: xhrExtra,
      });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(payload).toBe(`"${newData.userId}_${newData.role}"`);
    });
    describe("when onRequestStart got executed", () => {
      it("should use effect lifecycle method", async () => {
        const { onRequestStart } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        onRequestStart();
        expect(onStartSpy).toHaveBeenCalledTimes(1);
      });
      it("should emit request start event", async () => {
        const { onRequestStart } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        const spy = jest.fn();
        const unmount = client.requestManager.events.onRequestStart(request.queueKey, spy);
        onRequestStart();
        unmount();
        expect(spy).toHaveBeenCalledTimes(1);
      });
      it("should emit upload progress event", async () => {
        const { onRequestStart } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        const spy = jest.fn();
        const unmount = client.requestManager.events.onUploadProgress(request.queueKey, spy);
        const startTimestamp = onRequestStart();
        unmount();
        testProgressSpy({ spy, request, requestId, startTimestamp });
      });
      it("should emit upload progress event with specified payload size", async () => {
        const { onRequestStart } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        const progress = {
          total: 9999,
          loaded: 0,
        };

        const spy = jest.fn();
        const unmount = client.requestManager.events.onUploadProgress(request.queueKey, spy);
        const startTimestamp = onRequestStart(progress);
        unmount();
        testProgressSpy({ ...progress, spy, request, requestId, startTimestamp });
      });
    });
    describe("when onRequestProgress got executed", () => {
      const progress = {
        total: 9999,
        loaded: 30,
      };

      it("should emit upload progress event", async () => {
        const { onRequestStart, onRequestProgress } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        const spy = jest.fn();
        const startTimestamp = onRequestStart();
        await sleep(30);
        const unmount = client.requestManager.events.onUploadProgress(request.queueKey, spy);
        const progressTimestamp = onRequestProgress(progress);
        unmount();
        testProgressSpy({ ...progress, spy, request, requestId, startTimestamp, progressTimestamp });
      });

      it("should create start timestamp if it's not available", async () => {
        const { onRequestProgress, getRequestStartTimestamp } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: {
            headers: {},
          },
        });
        expect(getRequestStartTimestamp()).toBeNull();
        const progressTimestamp = onRequestProgress(progress);
        expect(progressTimestamp).toBeNumber();
      });

      it("should emit correct loaded value", async () => {
        const { onRequestProgress } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        let value: number;
        const unmount = client.requestManager.events.onUploadProgress(request.queueKey, ({ loaded }) => {
          value = loaded;
        });
        onRequestProgress({});
        expect(value).toBe(0);
        unmount();
      });

      it("should emit correct loaded value", async () => {
        const { onResponseProgress } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        let value: number;
        const unmount = client.requestManager.events.onDownloadProgress(request.queueKey, ({ loaded }) => {
          value = loaded;
        });
        onResponseProgress({});
        expect(value).toBe(0);
        unmount();
      });
    });
    describe("when onRequestEnd got executed", () => {
      const progress = {
        total: 9999,
        loaded: 9999,
      };

      it("should emit upload progress event", async () => {
        const { onRequestStart, onRequestEnd } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        const spy = jest.fn();
        const startTimestamp = onRequestStart({ total: progress.total, loaded: 0 });
        await sleep(30);
        const unmount = client.requestManager.events.onUploadProgress(request.queueKey, spy);
        const progressTimestamp = onRequestEnd();
        unmount();
        testProgressSpy({ ...progress, spy, request, requestId, startTimestamp, progressTimestamp, timeLeft: 0 });
      });

      it("should create start timestamp if it's not available", async () => {
        const { onRequestEnd, getRequestStartTimestamp } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: {
            headers: {},
          },
        });
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
        const { onResponseStart } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        const spy = jest.fn();
        const unmount = client.requestManager.events.onResponseStart(request.queueKey, spy);
        onResponseStart();
        unmount();
        expect(spy).toHaveBeenCalledTimes(1);
      });
      it("should emit download progress event", async () => {
        const { onResponseStart } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        const spy = jest.fn();
        const unmount = client.requestManager.events.onDownloadProgress(request.queueKey, spy);
        const startTimestamp = onResponseStart();
        unmount();
        testProgressSpy({ spy, request, requestId, startTimestamp });
      });
      it("should emit download progress event with specified payload size", async () => {
        const { onResponseStart } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        const progress = {
          total: 9999,
          loaded: 0,
        };

        const spy = jest.fn();
        const unmount = client.requestManager.events.onDownloadProgress(request.queueKey, spy);
        const startTimestamp = onResponseStart(progress);
        unmount();
        testProgressSpy({ ...progress, spy, request, requestId, startTimestamp });
      });
      it("should emit correct total value", async () => {
        const { onResponseStart } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        let value: number;
        const unmount = client.requestManager.events.onDownloadProgress(request.queueKey, ({ total }) => {
          value = total;
        });
        onResponseStart();
        expect(value).toBe(1);
        onResponseStart({ total: 0, loaded: 7 });
        expect(value).toBe(7);
        onResponseStart({ total: 10, loaded: 0 });
        expect(value).toBe(10);
        // If we have previous value stored it needs to take the biggest value
        onResponseStart({ total: 8, loaded: 0 });
        expect(value).toBe(10);
        unmount();
      });
    });
    describe("when onResponseProgress got executed", () => {
      const progress = {
        total: 9999,
        loaded: 30,
      };

      it("should emit upload progress event", async () => {
        const { onResponseStart, onResponseProgress } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: {
            headers: {},
          },
        });
        const spy = jest.fn();
        const startTimestamp = onResponseStart();
        await sleep(30);
        const unmount = client.requestManager.events.onDownloadProgress(request.queueKey, spy);
        const progressTimestamp = onResponseProgress(progress);
        unmount();
        testProgressSpy({ ...progress, spy, request, requestId, startTimestamp, progressTimestamp });
      });

      it("should create start timestamp if it's not available", async () => {
        const { onResponseProgress, getResponseStartTimestamp } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: {
            headers: {},
          },
        });
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
        const { onResponseStart, onResponseEnd } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        const spy = jest.fn();
        const startTimestamp = onResponseStart({ total: progress.total, loaded: 0 });
        await sleep(30);
        const unmount = client.requestManager.events.onDownloadProgress(request.queueKey, spy);
        const progressTimestamp = onResponseEnd();
        unmount();
        testProgressSpy({ ...progress, spy, request, requestId, startTimestamp, progressTimestamp, timeLeft: 0 });
      });

      it("should create start timestamp if it's not available", async () => {
        const { onResponseEnd, getResponseStartTimestamp } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: {
            headers: {},
          },
        });
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
        const { onSuccess } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        const response = await onSuccess(data, 200, xhrExtra, () => null);
        expect(response).toEqual(successResponse);
      });
      it("should use effect lifecycle methods", async () => {
        const { onSuccess } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        await onSuccess(data, 200, xhrExtra, () => null);
        expect(onSuccessSpy).toHaveBeenCalledTimes(1);
        expect(onFinishedSpy).toHaveBeenCalledTimes(1);
        expect(onSuccessSpy).toHaveBeenCalledWith(successResponse, request);
        expect(onFinishedSpy).toHaveBeenCalledWith(successResponse, request);
      });
      it("should return data transformed by __modifyResponse", async () => {
        const { onSuccess } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        client.__onResponseCallbacks.push(() => successResponse);
        const response = await onSuccess(data, 200, xhrExtra, () => null);
        client.__onResponseCallbacks = [];
        expect(response).toEqual(successResponse);
      });
      it("should return data transformed by __modifySuccessResponse", async () => {
        const { onSuccess } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        client.__onSuccessCallbacks.push(() => successResponse);
        const response = await onSuccess(data, 200, xhrExtra, () => null);
        client.__onSuccessCallbacks = [];
        expect(response).toEqual(successResponse);
      });
      it("should execute __modifySuccessResponse as last modifier", async () => {
        const { onSuccess } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        const newData: ResponseType<unknown, unknown, AdapterType> = {
          data: "modified",
          error: null,
          success: true,
          status: 222,
          extra: xhrExtra,
        };
        client.__onResponseCallbacks.push(() => errorResponse);
        client.__onSuccessCallbacks.push(() => newData);
        const response = await onSuccess(data, 200, xhrExtra, () => null);
        client.__onResponseCallbacks = [];
        client.__onSuccessCallbacks = [];
        expect(response).toEqual(newData);
        expect(onSuccessSpy).toHaveBeenCalledWith(newData, request);
        expect(onFinishedSpy).toHaveBeenCalledWith(newData, request);
      });
    });
    describe("when onError got executed", () => {
      it("should return error data", async () => {
        const { onError } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        const response = await onError(data, 400, xhrExtra, () => null);
        expect(response).toEqual(errorResponse);
      });
      it("should use effect lifecycle methods", async () => {
        const { onError } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        await onError(data, 400, xhrExtra, () => null);
        expect(onErrorSpy).toHaveBeenCalledTimes(1);
        expect(onFinishedSpy).toHaveBeenCalledTimes(1);
        expect(onErrorSpy).toHaveBeenCalledWith(errorResponse, request);
        expect(onFinishedSpy).toHaveBeenCalledWith(errorResponse, request);
      });
      it("should return data transformed by __modifyResponse", async () => {
        const { onError } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        client.__onResponseCallbacks.push(() => errorResponse);
        const response = await onError(data, 400, xhrExtra, () => null);
        client.__onResponseCallbacks = [];
        expect(response).toEqual(errorResponse);
      });
      it("should return data transformed by __modifyErrorResponse", async () => {
        const { onError } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        client.__onErrorCallbacks.push(() => errorResponse);
        const response = await onError(data, 400, xhrExtra, () => null);
        client.__onErrorCallbacks = [];
        expect(response).toEqual(errorResponse);
      });
      it("should execute __modifyErrorResponse as last modifier", async () => {
        const { onError } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        const newData: ResponseType<unknown, unknown, AdapterType> = {
          data: "modified",
          error: 444,
          success: false,
          status: null,
          extra: xhrExtra,
        };
        client.__onResponseCallbacks.push(() => successResponse);
        client.__onErrorCallbacks.push(() => newData);
        const response = await onError(data, 400, xhrExtra, () => null);
        client.__onErrorCallbacks = [];
        client.__onResponseCallbacks = [];
        expect(response).toEqual(newData);
        expect(onErrorSpy).toHaveBeenCalledWith(newData, request);
        expect(onFinishedSpy).toHaveBeenCalledWith(newData, request);
      });
    });
    describe("when errors methods got executed", () => {
      it("should return correct message when onAbortError is executed", async () => {
        const { onAbortError } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        const response = await onAbortError(0, xhrExtra, () => null);
        expect(response).toEqual({
          data: null,
          error: getErrorMessage("abort"),
          status: 0,
          success: false,
          extra: xhrExtra,
        });
      });
      it("should return correct message when onTimeoutError is executed", async () => {
        const { onTimeoutError } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        const response = await onTimeoutError(0, xhrExtra, () => null);
        expect(response).toEqual({
          data: null,
          error: getErrorMessage("timeout"),
          status: 0,
          success: false,
          extra: xhrExtra,
        });
      });
      it("should return correct message when onUnexpectedError is executed", async () => {
        const { onUnexpectedError } = await getAdapterBindings({
          request,
          requestId,
          systemErrorStatus: 0,
          systemErrorExtra: xhrExtra,
        });
        const response = await onUnexpectedError(0, xhrExtra, () => null);
        expect(response).toEqual({
          data: null,
          error: getErrorMessage(),
          status: 0,
          success: false,
          extra: xhrExtra,
        });
      });
    });
  });
});

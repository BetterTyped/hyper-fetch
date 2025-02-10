import { createHttpMockingServer, sleep } from "@hyper-fetch/testing";

import { Plugin } from "plugin";
import { getAdapterBindings, ResponseType, getErrorMessage, ResponseErrorType } from "adapter";
import { testProgressSpy } from "../../shared";
import { Client } from "client";
import { RequestInstance } from "request";
import { HttpAdapterOptionsType, HttpAdapterType, xhrExtra } from "http-adapter";

const { resetMocks, startServer, stopServer } = createHttpMockingServer();

describe("Adapter [ Bindings ]", () => {
  const url = "http://localhost:9000";
  const endpoint = "/endpoint";
  const requestId = "test";
  const queryParams = "?query=params";
  const data = { value: 1 };
  const successResponse: Omit<
    ResponseType<unknown, unknown, HttpAdapterType>,
    "requestTimestamp" | "responseTimestamp"
  > = {
    data,
    error: null,
    success: true,
    status: 200,
    extra: xhrExtra,
  };
  const errorResponse: Omit<
    ResponseType<unknown, unknown, HttpAdapterType>,
    "requestTimestamp" | "responseTimestamp"
  > = {
    data: null,
    error: data,
    success: false,
    status: 400,
    extra: xhrExtra,
  };
  const requestConfig: HttpAdapterOptionsType = { responseType: "arraybuffer", timeout: 1000 };

  const onTriggerSpy = jest.fn();
  const onErrorSpy = jest.fn();
  const onFinishedSpy = jest.fn();
  const onStartSpy = jest.fn();
  const onSuccessSpy = jest.fn();

  const initializeSetup = () => {
    const effect = new Plugin({
      name: "test",
    })
      .onRequestTrigger(onTriggerSpy)
      .onRequestError(onErrorSpy)
      .onRequestFinished(onFinishedSpy)
      .onRequestStart(onStartSpy)
      .onRequestSuccess(onSuccessSpy);

    const client = new Client({ url }).addPlugin(effect);
    const request = client
      .createRequest<{
        response: any;
        payload: { value: number };
        queryParams: string;
      }>()({ endpoint, options: requestConfig })
      .setPayload(data)
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
    resetMocks();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("when getAdapterBindings get initialized", () => {
    it("should create correct fullUrl", async () => {
      const {
        url: u,
        endpoint: e,
        queryParams: q,
      } = await getAdapterBindings({
        request,
        requestId,
        resolve: () => null,
        onStartTime: () => null,
      });
      expect(u).toBe(url);
      expect(e).toBe(endpoint);
      expect(q).toBe(queryParams);
    });

    it("should create correct headers", async () => {
      const { headers } = await getAdapterBindings({
        request,
        requestId,
        resolve: () => null,
        onStartTime: () => null,
      });
      expect(headers).toEqual({ "Content-Type": "application/json" });
    });

    it("should create correct payload", async () => {
      const { payload } = await getAdapterBindings({
        request,
        requestId,
        resolve: () => null,
        onStartTime: () => null,
      });
      expect(payload).toEqual(JSON.stringify(data));
    });

    it("should create AbortController", async () => {
      request.client.requestManager.addAbortController(request.abortKey, requestId);
      const { getAbortController } = await getAdapterBindings({
        request,
        requestId,
        resolve: () => null,
        onStartTime: () => null,
      });
      expect(getAbortController()).toBeDefined();
    });
  });

  describe("given bindings abort methods being used", () => {
    describe("when using AbortController methods", () => {
      it("should create listener using createAbortListener", async () => {
        const resolveSpy = jest.fn();
        const { createAbortListener, getAbortController } = await getAdapterBindings({
          request,
          requestId,
          resolve: resolveSpy,
          onStartTime: () => null,
        });
        const spy = jest.fn();
        request.client.requestManager.addAbortController(request.abortKey, requestId);
        const controller = getAbortController();
        const unmount = createAbortListener({ status: 0, extra: xhrExtra, onAbort: spy });
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
          resolve: () => null,
          onStartTime: () => null,
        });
        const spy = jest.fn();
        const resolveSpy = jest.fn();
        const controller = getAbortController();
        const unmount = createAbortListener({ status: 0, extra: xhrExtra, onAbort: spy });
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
          resolve: () => null,
          onStartTime: () => null,
        });
        client.requestManager.abortControllers.clear();
        expect(() => createAbortListener({ status: 0, extra: xhrExtra, onAbort: () => null })).toThrow();
      });
      it("should call onAbort when signal is aborted", async () => {
        request.client.requestManager.addAbortController(request.abortKey, requestId);

        const abortController = request.client.requestManager.getAbortController(request.abortKey, requestId);

        abortController?.abort();
        const spy = jest.fn();

        const { createAbortListener } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
        });

        createAbortListener({ status: 0, extra: xhrExtra, onAbort: spy });

        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("given bindings pre-request methods being used", () => {
    describe("when onBeforeRequest got executed", () => {
      it("should use effect lifecycle method ", async () => {
        const { onBeforeRequest } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
        });
        onBeforeRequest();
        expect(onTriggerSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  // Request
  describe("given bindings request methods being used", () => {
    it("should allow for setting data mapper", async () => {
      const req = client.createRequest<{
        response: any;
        payload: { role: string; userId: number };
        error: Error;
        queryParams: { userId: number; role: string };
      }>()({
        endpoint: "shared-endpoint/",
      });
      const spy = jest.fn();
      const newData = {
        userId: 11,
        role: "ADMIN",
      };

      const requestMapped = req.setPayloadMapper<string>((value) => {
        const { role, userId } = value;
        spy();
        return `${userId}_${role}`;
      });
      const requestSetData = requestMapped.setPayload(newData);

      const { payload } = await getAdapterBindings({
        request: requestSetData,
        requestId,
        resolve: () => null,
        onStartTime: () => null,
      });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(payload).toBe(`${newData.userId}_${newData.role}`);
    });
    it("should allow for setting request mapper", async () => {
      const req = client.createRequest<{
        response: any;
        payload: Record<string, unknown>;
        error: any;
        queryParams: { userId: number; role: string };
      }>()({
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
        return (r as RequestInstance).setPayload(`${newData.userId}_${newData.role}`);
      });
      const requestSetData = requestMapped.setPayload(newData);

      const { payload } = await getAdapterBindings({
        request: requestSetData,
        requestId,
        resolve: () => null,
        onStartTime: () => null,
      });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(payload).toBe(`"${newData.userId}_${newData.role}"`);
    });
    describe("when onRequestStart got executed", () => {
      it("should use effect lifecycle method", async () => {
        const { onRequestStart } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
        });
        onRequestStart();
        expect(onStartSpy).toHaveBeenCalledTimes(1);
      });
      it("should emit request start event", async () => {
        const { onRequestStart } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
        });
        const spy = jest.fn();
        const unmount = client.requestManager.events.onRequestStartByQueue(request.queryKey, spy);
        onRequestStart();
        unmount();
        expect(spy).toHaveBeenCalledTimes(1);
      });
      it("should emit upload progress event", async () => {
        const { onRequestStart } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
        });
        const spy = jest.fn();
        const unmount = client.requestManager.events.onUploadProgressByQueue(request.queryKey, spy);
        const startTimestamp = onRequestStart();
        unmount();
        testProgressSpy({ spy, request, requestId, startTimestamp });
      });
      it("should emit upload progress event with specified payload size", async () => {
        const { onRequestStart } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
        });
        const progress = {
          total: 9999,
          loaded: 0,
        };

        const spy = jest.fn();
        const unmount = client.requestManager.events.onUploadProgressByQueue(request.queryKey, spy);
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
          resolve: () => null,
          onStartTime: () => null,
        });
        const spy = jest.fn();
        const startTimestamp = onRequestStart();
        await sleep(30);
        const unmount = client.requestManager.events.onUploadProgressByQueue(request.queryKey, spy);
        const progressTimestamp = onRequestProgress(progress);
        unmount();
        testProgressSpy({ ...progress, spy, request, requestId, startTimestamp, progressTimestamp });
      });

      it("should create start timestamp if it's not available", async () => {
        const { onRequestProgress, getRequestStartTimestamp } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
        });
        expect(getRequestStartTimestamp()).toBeNull();
        const progressTimestamp = onRequestProgress(progress);
        expect(progressTimestamp).toBeNumber();
      });

      it("should emit correct loaded value", async () => {
        const { onRequestProgress } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
        });
        let value: number | undefined;
        const unmount = client.requestManager.events.onUploadProgressByQueue(request.queryKey, ({ loaded }) => {
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
          resolve: () => null,
          onStartTime: () => null,
        });
        let value: number | undefined;
        const unmount = client.requestManager.events.onDownloadProgressByQueue(request.queryKey, ({ loaded }) => {
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
          resolve: () => null,
          onStartTime: () => null,
        });
        const spy = jest.fn();
        const startTimestamp = onRequestStart({ total: progress.total, loaded: 0 });
        await sleep(30);
        const unmount = client.requestManager.events.onUploadProgressByQueue(request.queryKey, spy);
        const progressTimestamp = onRequestEnd();
        unmount();
        testProgressSpy({ ...progress, spy, request, requestId, startTimestamp, progressTimestamp, timeLeft: 0 });
      });

      it("should create start timestamp if it's not available", async () => {
        const { onRequestEnd, getRequestStartTimestamp } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
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
          resolve: () => null,
          onStartTime: () => null,
        });
        const spy = jest.fn();
        const unmount = client.requestManager.events.onResponseStartByQueue(request.queryKey, spy);
        onResponseStart();
        unmount();
        expect(spy).toHaveBeenCalledTimes(1);
      });
      it("should emit download progress event", async () => {
        const { onResponseStart } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
        });
        const spy = jest.fn();
        const unmount = client.requestManager.events.onDownloadProgressByQueue(request.queryKey, spy);
        const startTimestamp = onResponseStart();
        unmount();
        testProgressSpy({ spy, request, requestId, startTimestamp });
      });
      it("should emit download progress event with specified payload size", async () => {
        const { onResponseStart } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
        });
        const progress = {
          total: 9999,
          loaded: 0,
        };

        const spy = jest.fn();
        const unmount = client.requestManager.events.onDownloadProgressByQueue(request.queryKey, spy);
        const startTimestamp = onResponseStart(progress);
        unmount();
        testProgressSpy({ ...progress, spy, request, requestId, startTimestamp });
      });
      it("should emit correct total value", async () => {
        const { onResponseStart } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
        });
        let value: number | undefined;
        const unmount = client.requestManager.events.onDownloadProgressByQueue(request.queryKey, ({ total }) => {
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
          resolve: () => null,
          onStartTime: () => null,
        });
        const spy = jest.fn();
        const startTimestamp = onResponseStart();
        await sleep(30);
        const unmount = client.requestManager.events.onDownloadProgressByQueue(request.queryKey, spy);
        const progressTimestamp = onResponseProgress(progress);
        unmount();
        testProgressSpy({ ...progress, spy, request, requestId, startTimestamp, progressTimestamp });
      });

      it("should create start timestamp if it's not available", async () => {
        const { onResponseProgress, getResponseStartTimestamp } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
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
          resolve: () => null,
          onStartTime: () => null,
        });
        const spy = jest.fn();
        const startTimestamp = onResponseStart({ total: progress.total, loaded: 0 });
        await sleep(30);
        const unmount = client.requestManager.events.onDownloadProgressByQueue(request.queryKey, spy);
        const progressTimestamp = onResponseEnd();
        unmount();
        testProgressSpy({ ...progress, spy, request, requestId, startTimestamp, progressTimestamp, timeLeft: 0 });
      });

      it("should create start timestamp if it's not available", async () => {
        const { onResponseEnd, getResponseStartTimestamp } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
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
          resolve: () => null,
          onStartTime: () => null,
        });
        const { responseTimestamp, requestTimestamp, ...response } = await onSuccess({
          data,
          status: 200,
          extra: xhrExtra,
        });
        expect(response).toEqual(expect.objectContaining(successResponse));
        expect(requestTimestamp).toBeNumber();
        expect(responseTimestamp).toBeGreaterThanOrEqual(requestTimestamp);
      });
      it("should use effect lifecycle methods", async () => {
        const { onSuccess } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
        });
        await onSuccess({ data, status: 200, extra: xhrExtra });
        expect(onSuccessSpy).toHaveBeenCalledTimes(1);
        expect(onFinishedSpy).toHaveBeenCalledTimes(1);
        expect(onSuccessSpy).toHaveBeenCalledWith({ response: expect.objectContaining(successResponse), request });
        expect(onFinishedSpy).toHaveBeenCalledWith({ response: expect.objectContaining(successResponse), request });
      });
      it("should return data transformed by __modifyResponse", async () => {
        const { onSuccess } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
        });
        client.unsafe_onResponseCallbacks.push(() => ({
          ...successResponse,
          responseTimestamp: expect.toBeNumber(),
          requestTimestamp: expect.toBeNumber(),
        }));
        const response = await onSuccess({ data, status: 200, extra: xhrExtra });
        client.unsafe_onResponseCallbacks = [];
        expect(response).toEqual(expect.objectContaining(successResponse));
      });
      it("should return data transformed by __modifySuccessResponse", async () => {
        const { onSuccess } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
        });
        client.unsafe_onSuccessCallbacks.push(() => ({
          ...successResponse,
          responseTimestamp: expect.toBeNumber(),
          requestTimestamp: expect.toBeNumber(),
        }));
        const response = await onSuccess({ data, status: 200, extra: xhrExtra });
        client.unsafe_onSuccessCallbacks = [];
        expect(response).toEqual(expect.objectContaining(successResponse));
      });
      it("should execute __modifySuccessResponse as last modifier", async () => {
        const { onSuccess } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
        });
        const newData: ResponseType<unknown, unknown, HttpAdapterType> = {
          data: "modified",
          error: null,
          success: true,
          status: 222,
          extra: xhrExtra,
          requestTimestamp: expect.toBeNumber(),
          responseTimestamp: expect.toBeNumber(),
        };
        client.unsafe_onResponseCallbacks.push(() => ({
          ...errorResponse,
          requestTimestamp: expect.toBeNumber(),
          responseTimestamp: expect.toBeNumber(),
        }));
        client.unsafe_onSuccessCallbacks.push(() => newData);
        const response = await onSuccess({ data, status: 200, extra: xhrExtra });
        client.unsafe_onResponseCallbacks = [];
        client.unsafe_onSuccessCallbacks = [];
        expect(response).toEqual(expect.objectContaining(newData));
        expect(onSuccessSpy).toHaveBeenCalledWith({ response: expect.objectContaining(newData), request });
        expect(onFinishedSpy).toHaveBeenCalledWith({ response: expect.objectContaining(newData), request });
      });
    });
    describe("when onError got executed", () => {
      it("should return error data", async () => {
        const { onError } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
        });
        const { requestTimestamp, responseTimestamp, ...response } = await onError({
          error: data,
          status: 400,
          extra: xhrExtra,
        });
        expect(response).toEqual(errorResponse);
        expect(requestTimestamp).toBeNumber();
        expect(responseTimestamp).toBeGreaterThanOrEqual(requestTimestamp);
      });
      it("should use effect lifecycle methods", async () => {
        const { onError } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
        });
        await onError({ error: data, status: 400, extra: xhrExtra });
        expect(onErrorSpy).toHaveBeenCalledTimes(1);
        expect(onFinishedSpy).toHaveBeenCalledTimes(1);
        expect(onErrorSpy).toHaveBeenCalledWith({ response: expect.objectContaining(errorResponse), request });
        expect(onFinishedSpy).toHaveBeenCalledWith({ response: expect.objectContaining(errorResponse), request });
      });
      it("should return data transformed by __modifyResponse", async () => {
        const { onError } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
        });
        client.unsafe_onResponseCallbacks.push(() => ({
          ...errorResponse,
          requestTimestamp: expect.toBeNumber(),
          responseTimestamp: expect.toBeNumber(),
        }));
        const response = await onError({ error: data, status: 400, extra: xhrExtra });
        client.unsafe_onResponseCallbacks = [];
        expect(response).toEqual(expect.objectContaining(errorResponse));
      });
      it("should return data transformed by unsafe_modifyErrorResponse", async () => {
        const { onError } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
        });
        client.unsafe_onErrorCallbacks.push(() => ({
          ...errorResponse,
          requestTimestamp: expect.toBeNumber(),
          responseTimestamp: expect.toBeNumber(),
        }));
        const response = await onError({ error: data, status: 400, extra: xhrExtra });
        client.unsafe_onErrorCallbacks = [];
        expect(response).toEqual(expect.objectContaining(errorResponse));
      });
      it("should execute unsafe_modifyErrorResponse as last modifier", async () => {
        const { onError } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
        });
        const newData: ResponseType<unknown, unknown, HttpAdapterType> = {
          data: "modified",
          error: 444,
          success: false,
          status: null,
          extra: xhrExtra,
          requestTimestamp: expect.toBeNumber(),
          responseTimestamp: expect.toBeNumber(),
        };
        client.unsafe_onResponseCallbacks.push(() => ({
          ...successResponse,
          responseTimestamp: expect.toBeNumber(),
          requestTimestamp: expect.toBeNumber(),
        }));
        client.unsafe_onErrorCallbacks.push(() => newData);
        const response = await onError({ error: data, status: 400, extra: xhrExtra });
        client.unsafe_onErrorCallbacks = [];
        client.unsafe_onResponseCallbacks = [];
        expect(response).toEqual(newData);
        expect(onErrorSpy).toHaveBeenCalledWith({ response: newData, request });
        expect(onFinishedSpy).toHaveBeenCalledWith({ response: newData, request });
      });
    });
    describe("when errors methods got executed", () => {
      it("should return correct message when onAbortError is executed", async () => {
        const { onAbortError } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
        });
        const response = await onAbortError({ status: 0, extra: xhrExtra });
        expect(response).toEqual({
          data: null,
          error: getErrorMessage("abort"),
          status: 0,
          success: false,
          extra: xhrExtra,
          requestTimestamp: expect.toBeNumber(),
          responseTimestamp: expect.toBeNumber(),
        } satisfies ResponseErrorType<any, HttpAdapterType>);
      });
      it("should return correct message when onTimeoutError is executed", async () => {
        const { onTimeoutError } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
        });
        const response = await onTimeoutError({ status: 0, extra: xhrExtra });
        expect(response).toEqual({
          data: null,
          error: getErrorMessage("timeout"),
          status: 0,
          success: false,
          extra: xhrExtra,
          requestTimestamp: expect.toBeNumber(),
          responseTimestamp: expect.toBeNumber(),
        } satisfies ResponseErrorType<any, HttpAdapterType>);
      });
      it("should return correct message when onUnexpectedError is executed", async () => {
        const { onUnexpectedError } = await getAdapterBindings({
          request,
          requestId,
          resolve: () => null,
          onStartTime: () => null,
        });
        const response = await onUnexpectedError({ status: 0, extra: xhrExtra });
        expect(response).toEqual({
          data: null,
          error: getErrorMessage(),
          status: 0,
          success: false,
          extra: xhrExtra,
          requestTimestamp: expect.toBeNumber(),
          responseTimestamp: expect.toBeNumber(),
        } satisfies ResponseErrorType<any, HttpAdapterType>);
      });
    });
  });
});

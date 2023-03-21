import { getErrorMessage } from "adapter";
import { createClient, createRequest, sleep } from "../../utils";
import { createRequestInterceptor, resetInterceptors, startServer, stopServer } from "../../server";

describe("Request [ Sending ]", () => {
  const fixture = { test: 1, data: [1, 2, 3] };

  let client = createClient();
  let request = createRequest(client);

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = createClient();
    request = createRequest(client);
    resetInterceptors();
    jest.resetAllMocks();
    createRequestInterceptor(request, { fixture, delay: 40 });
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using request's exec method", () => {
    it("should return adapter response", async () => {
      const requestExecution = request.exec({});
      await sleep(5);
      expect(client.fetchDispatcher.getAllRunningRequest()).toHaveLength(0);
      const response = await requestExecution;
      expect(response).toStrictEqual({ data: fixture, error: null, status: 200, isSuccess: true, additionalData: {} });
    });
  });
  describe("When using request's send method", () => {
    it("should return adapter response", async () => {
      const response = await request.send({});

      expect(response).toStrictEqual({ data: fixture, error: null, status: 200, isSuccess: true, additionalData: {} });
    });
    it("should wait to resolve request in online mode", async () => {
      const spy = jest.fn();
      createRequestInterceptor(request, { delay: 10, status: 400 });
      const requestExecution = request.send({});
      await sleep(5);
      client.appManager.setOnline(false);

      const unmount = client.requestManager.events.onResponse(request.cacheKey, () => {
        spy();
        createRequestInterceptor(request, { fixture, delay: 40 });
        client.appManager.setOnline(true);
        unmount();
      });

      const response = await requestExecution;
      expect(response).toStrictEqual({ data: fixture, error: null, status: 200, isSuccess: true, additionalData: {} });
      expect(spy).toBeCalledTimes(1);
    });
    it("should wait to resolve request retries", async () => {
      const spy = jest.fn();
      createRequestInterceptor(request, { delay: 10, status: 400 });
      const requestExecution = request.setRetry(1).setRetryTime(30).send({});
      await sleep(5);

      const unmount = client.requestManager.events.onResponse(request.cacheKey, () => {
        spy();
        createRequestInterceptor(request, { fixture, delay: 40 });
        unmount();
      });

      const response = await requestExecution;
      expect(response).toStrictEqual({ data: fixture, error: null, status: 200, isSuccess: true, additionalData: {} });
      expect(spy).toBeCalledTimes(1);
    });
    it("should return error once request got removed", async () => {
      createRequestInterceptor(request, { delay: 10, status: 400 });
      const requestExecution = request.send({});
      await sleep(2);

      const runningRequests = client.fetchDispatcher.getAllRunningRequest();
      client.fetchDispatcher.delete(request.queueKey, runningRequests[0].requestId, request.abortKey);

      const response = await requestExecution;
      expect(response).toStrictEqual({
        data: null,
        error: getErrorMessage("deleted"),
        status: null,
        isSuccess: null,
        additionalData: {},
      });
    });
    it("should call remove error", async () => {
      const spy = jest.fn();
      createRequestInterceptor(request, { delay: 10, status: 400 });
      const requestExecution = request.send({ onRemove: spy });
      await sleep(2);

      const runningRequests = client.fetchDispatcher.getAllRunningRequest();
      client.fetchDispatcher.delete(request.queueKey, runningRequests[0].requestId, request.abortKey);

      await requestExecution;
      expect(spy).toBeCalledTimes(1);
    });
    it("should return cancel error", async () => {
      request = createRequest(client).setCancelable(true);
      const mock = createRequestInterceptor(request);

      const [res1, res2, res3] = await Promise.all([request.send(), request.send(), request.send()]);

      expect(res1).toStrictEqual({
        data: null,
        error: getErrorMessage("abort"),
        status: 0,
        isSuccess: false,
        additionalData: {},
      });
      expect(res2).toStrictEqual({
        data: null,
        error: getErrorMessage("abort"),
        status: 0,
        isSuccess: false,
        additionalData: {},
      });
      expect(res3).toStrictEqual({ data: mock, error: null, status: 200, isSuccess: true, additionalData: {} });
    });
    /**
     * Solve #40 https://github.com/BetterTyped/hyper-fetch/issues/40
     */
    it("should return cancel error for cancelable requests", async () => {
      const getUsers = client.createRequest()({
        method: "GET",
        endpoint: "/users",
        cancelable: true,
      });

      const mock = createRequestInterceptor(getUsers);

      const [res1, res2, res3] = await Promise.all([getUsers.send(), getUsers.send(), getUsers.send()]);

      expect(res1).toStrictEqual({
        data: null,
        error: getErrorMessage("abort"),
        status: 0,
        isSuccess: false,
        additionalData: {},
      });
      expect(res2).toStrictEqual({
        data: null,
        error: getErrorMessage("abort"),
        status: 0,
        isSuccess: false,
        additionalData: {},
      });
      expect(res3).toStrictEqual({ data: mock, error: null, status: 200, isSuccess: true, additionalData: {} });
    });

    it("should allow to call the request callbacks", async () => {
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const spy3 = jest.fn();
      const spy4 = jest.fn();
      const spy5 = jest.fn();
      const spy6 = jest.fn();

      await request.send({
        onSettle: spy1,
        onRequestStart: spy2,
        onResponseStart: spy3,
        onUploadProgress: spy4,
        onDownloadProgress: spy5,
        onResponse: spy6,
      });

      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(1);
      expect(spy3).toBeCalledTimes(1);
      expect(spy4).toBeCalledTimes(2);
      expect(spy5).toBeCalledTimes(3);
      expect(spy6).toBeCalledTimes(1);
    });
  });
});

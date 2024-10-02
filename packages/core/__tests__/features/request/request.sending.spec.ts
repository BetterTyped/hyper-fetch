import { createHttpMockingServer } from "@hyper-fetch/testing";

import { getErrorMessage, xhrExtra } from "adapter";
import { sleep } from "../../utils";
import { Client } from "client";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("Request [ Sending ]", () => {
  const fixture = { test: 1, data: [1, 2, 3] };

  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest<{ response: any }>()({ endpoint: "shared-base-endpoint" });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest<{ response: any }>()({ endpoint: "shared-base-endpoint" });
    resetMocks();
    jest.resetAllMocks();
    mockRequest(request, { data: fixture, delay: 40 });
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using request's exec method", () => {
    it("should return adapter response", async () => {
      const requestExecution = request.exec({});
      await sleep(5);
      expect(client.fetchDispatcher.getAllRunningRequests()).toHaveLength(0);
      const response = await requestExecution;
      expect(response).toStrictEqual({
        data: fixture,
        error: null,
        status: 200,
        success: true,
        extra: { headers: { "content-type": "application/json", "content-length": "25" } },
      });
    });
    it("should return mapped adapter response", async () => {
      const requestExecution = request.setResponseMapper((res) => ({ ...res, data: { nested: res.data } })).exec({});
      await sleep(5);
      expect(client.fetchDispatcher.getAllRunningRequests()).toHaveLength(0);
      const response = await requestExecution;
      expect(response).toStrictEqual({
        data: { nested: fixture },
        error: null,
        status: 200,
        success: true,
        extra: { headers: { "content-type": "application/json", "content-length": "25" } },
      });
    });
  });
  describe("When using request's send method", () => {
    it("should return adapter response", async () => {
      const response = await request.send({});

      expect(response).toStrictEqual({
        data: fixture,
        error: null,
        status: 200,
        success: true,
        extra: { headers: { "content-type": "application/json", "content-length": "25" } },
      });
    });
    it("should return mapped adapter response", async () => {
      const response = await request.setResponseMapper((res) => ({ ...res, data: { nested: res.data } })).send({});

      expect(response).toStrictEqual({
        data: { nested: fixture },
        error: null,
        status: 200,
        success: true,
        extra: { headers: { "content-type": "application/json", "content-length": "25" } },
      });
    });
    it("should return async mapped adapter response", async () => {
      const response = await request
        .setResponseMapper(async (res) => Promise.resolve({ ...res, data: { nested: res.data } }))
        .send({});

      expect(response).toStrictEqual({
        data: { nested: fixture },
        error: null,
        status: 200,
        success: true,
        extra: { headers: { "content-type": "application/json", "content-length": "25" } },
      });
    });
    it("should wait to resolve request in online mode", async () => {
      const spy = jest.fn();
      mockRequest(request, { delay: 10, status: 400 });
      const requestExecution = request.send({});
      await sleep(5);
      client.appManager.setOnline(false);

      const unmount = client.requestManager.events.onResponseByCache(request.cacheKey, () => {
        spy();
        mockRequest(request, { data: fixture, delay: 40 });
        client.appManager.setOnline(true);
        unmount();
      });

      const response = await requestExecution;
      expect(response).toStrictEqual({
        data: fixture,
        error: null,
        status: 200,
        success: true,
        extra: { headers: { "content-type": "application/json", "content-length": "25" } },
      });
      expect(spy).toHaveBeenCalledTimes(1);
    });
    it("should wait to resolve request retries", async () => {
      const spy = jest.fn();
      mockRequest(request, { delay: 10, status: 400 });
      const requestExecution = request.setRetry(1).setRetryTime(30).send({});
      await sleep(5);

      const unmount = client.requestManager.events.onResponseByCache(request.cacheKey, () => {
        spy();
        mockRequest(request, { data: fixture, delay: 40 });
        unmount();
      });

      const response = await requestExecution;
      expect(response).toStrictEqual({
        data: fixture,
        error: null,
        status: 200,
        success: true,
        extra: { headers: { "content-type": "application/json", "content-length": "25" } },
      });
      expect(spy).toHaveBeenCalledTimes(1);
    });
    it("should return error once request got removed", async () => {
      mockRequest(request, { delay: 10, status: 400 });
      const requestExecution = request.send({});
      await sleep(2);

      const runningRequests = client.fetchDispatcher.getAllRunningRequests();
      client.fetchDispatcher.delete(request.queueKey, runningRequests[0].requestId, request.abortKey);

      const response = await requestExecution;
      expect(response).toStrictEqual({
        data: null,
        error: getErrorMessage("deleted"),
        status: null,
        success: null,
        extra: xhrExtra,
      });
    });
    it("should call remove error", async () => {
      const spy = jest.fn();
      mockRequest(request, { delay: 10, status: 400 });
      const requestExecution = request.send({ onRemove: spy });
      await sleep(2);

      const runningRequests = client.fetchDispatcher.getAllRunningRequests();
      client.fetchDispatcher.delete(request.queueKey, runningRequests[0].requestId, request.abortKey);

      await requestExecution;
      expect(spy).toHaveBeenCalledTimes(1);
    });
    it("should return cancel error", async () => {
      const newRequest = client
        .createRequest<{ response: any }>()({ endpoint: "shared-base-endpoint" })
        .setCancelable(true);
      const mock = mockRequest(newRequest);

      const [res1, res2, res3] = await Promise.all([newRequest.send({}), newRequest.send({}), newRequest.send({})]);

      expect(res1).toStrictEqual({
        data: null,
        error: getErrorMessage("abort"),
        status: 0,
        success: false,
        extra: xhrExtra,
      });
      expect(res2).toStrictEqual({
        data: null,
        error: getErrorMessage("abort"),
        status: 0,
        success: false,
        extra: xhrExtra,
      });
      expect(res3).toStrictEqual({
        data: mock,
        error: null,
        status: 200,
        success: true,
        extra: { headers: { "content-type": "application/json", "content-length": "2" } },
      });
    });
    /**
     * Solved #40 https://github.com/BetterTyped/hyper-fetch/issues/40
     */
    it("should return cancel error for cancelable requests", async () => {
      const getUsers = client.createRequest()({
        method: "GET",
        endpoint: "/users",
        cancelable: true,
      });

      const mock = mockRequest(getUsers);

      const [res1, res2, res3] = await Promise.all([getUsers.send({}), getUsers.send({}), getUsers.send({})]);

      expect(res1).toStrictEqual({
        data: null,
        error: getErrorMessage("abort"),
        status: 0,
        success: false,
        extra: xhrExtra,
      });
      expect(res2).toStrictEqual({
        data: null,
        error: getErrorMessage("abort"),
        status: 0,
        success: false,
        extra: xhrExtra,
      });
      expect(res3).toStrictEqual({
        data: mock,
        error: null,
        status: 200,
        success: true,
        extra: { headers: { "content-type": "application/json", "content-length": "2" } },
      });
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

      expect(spy1).toHaveBeenCalledTimes(1);
      expect(spy2).toHaveBeenCalledTimes(1);
      expect(spy3).toHaveBeenCalledTimes(1);
      expect(spy4).toHaveBeenCalledTimes(2);
      expect(spy5).toHaveBeenCalledTimes(3);
      expect(spy6).toHaveBeenCalledTimes(1);
    });
  });
});

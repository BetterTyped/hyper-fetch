import { waitFor } from "@testing-library/dom";
import { createHttpMockingServer, sleep } from "@hyper-fetch/testing";

import { getErrorMessage } from "adapter";
import { Client } from "client";
import { xhrExtra } from "http-adapter";

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
    vi.resetAllMocks();
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
      const { responseTimestamp, requestTimestamp, ...response } = await requestExecution;
      expect(response).toStrictEqual({
        data: fixture,
        error: null,
        status: 200,
        success: true,
        extra: { headers: { "content-type": "application/json", "content-length": "25" } },
      });
    });
    it("should return mapped adapter response", async () => {
      const requestExecution = request
        .setResponseMapper((res) => ({ ...res, data: { nested: res.data } }) as typeof res)
        .exec({});
      await sleep(5);
      expect(client.fetchDispatcher.getAllRunningRequests()).toHaveLength(0);
      const { responseTimestamp, requestTimestamp, ...response } = await requestExecution;
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
      const { responseTimestamp, requestTimestamp, ...response } = await request.send({});

      expect(response).toStrictEqual({
        data: fixture,
        error: null,
        status: 200,
        success: true,
        extra: { headers: { "content-type": "application/json", "content-length": "25" } },
      });
    });
    it("should return mapped adapter response", async () => {
      const { responseTimestamp, requestTimestamp, ...response } = await request
        .setResponseMapper((res) => ({ ...res, data: { nested: res.data } }) as typeof res)
        .send({});

      expect(response).toStrictEqual({
        data: { nested: fixture },
        error: null,
        status: 200,
        success: true,
        extra: { headers: { "content-type": "application/json", "content-length": "25" } },
      });
    });
    it("should return async mapped adapter response", async () => {
      const { responseTimestamp, requestTimestamp, ...response } = await request
        .setResponseMapper(async (res) => Promise.resolve({ ...res, data: { nested: res.data } } as typeof res))
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
      const spy = vi.fn();
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

      const { responseTimestamp, requestTimestamp, ...response } = await requestExecution;
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
      const spy = vi.fn();
      mockRequest(request, { delay: 10, status: 400 });
      const requestExecution = request.setRetry(1).setRetryTime(30).send({});
      await sleep(5);

      const unmount = client.requestManager.events.onResponseByCache(request.cacheKey, () => {
        spy();
        mockRequest(request, { data: fixture, delay: 40 });
        unmount();
      });

      const { responseTimestamp, requestTimestamp, ...response } = await requestExecution;
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
      client.fetchDispatcher.delete(request.queryKey, runningRequests[0].requestId, request.abortKey);

      const { responseTimestamp, requestTimestamp, ...response } = await requestExecution;
      expect(response).toStrictEqual({
        data: null,
        error: getErrorMessage("deleted"),
        status: null,
        success: false,
        extra: xhrExtra,
      });
    });
    it("should call remove error", async () => {
      const spy = vi.fn();
      mockRequest(request, { delay: 10, status: 400 });
      const requestExecution = request.send({ onRemove: spy });
      await sleep(2);

      const runningRequests = client.fetchDispatcher.getAllRunningRequests();
      client.fetchDispatcher.delete(request.queryKey, runningRequests[0].requestId, request.abortKey);

      await requestExecution;
      expect(spy).toHaveBeenCalledTimes(1);
    });
    it("should return cancel error", async () => {
      const newRequest = client
        .createRequest<{ response: any }>()({ endpoint: "shared-base-endpoint" })
        .setCancelable(true);
      const mock = mockRequest(newRequest);

      const [
        { requestTimestamp: time1, responseTimestamp: time2, ...res1 },
        { requestTimestamp: time3, responseTimestamp: time4, ...res2 },
        { requestTimestamp: time5, responseTimestamp: time6, ...res3 },
      ] = await Promise.all([newRequest.send({}), newRequest.send({}), newRequest.send({})]);

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

      const [
        { requestTimestamp: time1, responseTimestamp: time2, ...res1 },
        { requestTimestamp: time3, responseTimestamp: time4, ...res2 },
        { requestTimestamp: time5, responseTimestamp: time6, ...res3 },
      ] = await Promise.all([getUsers.send({}), getUsers.send({}), getUsers.send({})]);

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
      const spy1 = vi.fn();
      const spy2 = vi.fn();
      const spy3 = vi.fn();
      const spy4 = vi.fn();
      const spy5 = vi.fn();
      const spy6 = vi.fn();

      await request.send({
        onBeforeSent: spy1,
        onRequestStart: spy2,
        onResponseStart: spy3,
        onUploadProgress: spy4,
        onDownloadProgress: spy5,
        onResponse: spy6,
      });

      expect(spy1).toHaveBeenCalledTimes(1);
      expect(spy2).toHaveBeenCalledTimes(1);
      expect(spy3).toHaveBeenCalledTimes(1);
      expect(spy4.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(spy5.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(spy6).toHaveBeenCalledTimes(1);
    });

    describe("cachePolicy", () => {
      it("cache-first uses read() and does not call adapter when cache is primed", async () => {
        const fetchSpy = vi.fn(() => ({ data: fixture, status: 200 }));
        const r = request.setMock(fetchSpy);
        await r.send({});
        fetchSpy.mockClear();

        const { responseTimestamp, requestTimestamp, ...response } = await r.send({ cachePolicy: "cache-first" });

        expect(response).toStrictEqual({
          data: fixture,
          error: null,
          status: 200,
          success: true,
          extra: xhrExtra,
        });
        expect(fetchSpy).not.toHaveBeenCalled();
      });

      it("cache-first fetches when cache is empty", async () => {
        const fetchSpy = vi.fn(() => ({ data: fixture, status: 200 }));
        const r = request.setMock(fetchSpy);
        client.cache.clear();

        await r.send({ cachePolicy: "cache-first" });

        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      it("revalidate resolves with cache immediately and refreshes in the background", async () => {
        const fetchSpy = vi.fn(() => ({ data: fixture, status: 200 }));
        const r = request.setMock(fetchSpy);
        await r.send({});
        fetchSpy.mockClear();
        fetchSpy.mockImplementation(() => ({ data: { refreshed: true } as any, status: 200 }));

        const { responseTimestamp, requestTimestamp, ...immediate } = await r.send({ cachePolicy: "revalidate" });

        expect(immediate.data).toStrictEqual(fixture);

        await waitFor(() => {
          expect(fetchSpy).toHaveBeenCalledTimes(1);
        });

        await waitFor(() => {
          expect(r.read()?.data).toStrictEqual({ refreshed: true });
        });
      });

      it("revalidate awaits network when cache is empty", async () => {
        const fetchSpy = vi.fn(() => ({ data: fixture, status: 200 }));
        const r = request.setMock(fetchSpy);
        client.cache.clear();

        const { responseTimestamp, requestTimestamp, ...response } = await r.send({ cachePolicy: "revalidate" });

        expect(response.data).toStrictEqual(fixture);
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      it("network-only matches default send", async () => {
        const { responseTimestamp, requestTimestamp, ...response } = await request.send({
          cachePolicy: "network-only",
        });

        expect(response).toStrictEqual({
          data: fixture,
          error: null,
          status: 200,
          success: true,
          extra: { headers: { "content-type": "application/json", "content-length": "25" } },
        });
      });

      it("cache-first applies response mapper without calling adapter", async () => {
        const fetchSpy = vi.fn(() => ({ data: fixture, status: 200 }));
        const r = request
          .setResponseMapper((res) => ({ ...res, data: { nested: res.data } }) as typeof res)
          .setMock(fetchSpy);
        await r.send({});
        fetchSpy.mockClear();

        const { responseTimestamp, requestTimestamp, ...response } = await r.send({ cachePolicy: "cache-first" });

        expect(response.data).toStrictEqual({ nested: fixture });
        expect(fetchSpy).not.toHaveBeenCalled();
      });
    });
  });
});

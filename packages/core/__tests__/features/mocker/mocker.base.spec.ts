import { waitFor } from "@testing-library/dom";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { createAdapter, createDispatcher, sleep } from "../../utils";
import { AdapterType, Client, getErrorMessage, ResponseDetailsType, ResponseType } from "../../../src";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("Mocker [ Base ]", () => {
  const adapterSpy = jest.fn();
  const fixture = { test: 1, data: [200, 300, 404] };
  let adapter = createAdapter({ callback: adapterSpy });
  let client = new Client({ url: "shared-base-url" }).setAdapter(() => adapter);
  let dispatcher = createDispatcher(client);
  let request = client.createRequest<any>()({ endpoint: "shared-base-endpoint" });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetMocks();
    adapter = createAdapter({ callback: adapterSpy });
    client = new Client({ url: "shared-base-url" }).setAdapter(() => adapter);
    dispatcher = createDispatcher(client);
    request = client.createRequest()({ endpoint: "shared-base-endpoint" });

    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using request's exec method", () => {
    it("should return adapter response", async () => {
      const mockedRequest = request.setMock({ data: fixture });
      const requestExecution = mockedRequest.exec();
      const response = await requestExecution;
      expect(response).toStrictEqual({
        data: fixture,
        error: null,
        status: 200,
        success: true,
        extra: {},
      });
    });
  });
  describe("When using request's send method", () => {
    it("should return adapter response", async () => {
      const mockedRequest = request.setMock({ data: fixture });
      const response = await mockedRequest.send();

      expect(response).toStrictEqual({
        data: fixture,
        error: null,
        status: 200,
        success: true,
        extra: {},
      });
    });
  });

  it("should return timeout error when request takes too long", async () => {
    const mockedRequest = client
      .createRequest<any>()({ endpoint: "shared-base-endpoint" })
      .setMock({
        data: fixture,
        config: { responseTime: 1500, timeout: true },
      });

    const response = await mockedRequest.send();

    expect(response.data).toBe(null);
    expect(response.error.message).toEqual(getErrorMessage("timeout").message);
  });

  it("should allow to cancel single running request", async () => {
    const firstSpy = jest.fn();
    const secondSpy = jest.fn();
    const firstRequest = client
      .createRequest<any>()({ endpoint: "shared-base-endpoint" })
      .setMock({
        data: fixture,
        config: {
          responseTime: 1500,
        },
      });
    const secondRequest = client
      .createRequest<any>()({ endpoint: "shared-base-endpoint" })
      .setMock({
        data: fixture,
        config: {
          responseTime: 1500,
        },
      });

    dispatcher.add(secondRequest);
    const requestId = dispatcher.add(firstRequest);
    client.requestManager.events.onAbortById(requestId, firstSpy);
    client.requestManager.events.onAbortByQueue(firstRequest.abortKey, secondSpy);

    await sleep(5);

    dispatcher.cancelRunningRequest(firstRequest.queueKey, requestId);

    expect(dispatcher.getRunningRequests(firstRequest.queueKey)).toHaveLength(1);
    expect(firstSpy).toHaveBeenCalledTimes(1);
    expect(secondSpy).toHaveBeenCalledTimes(1);
  });

  it("Should allow for retrying request", async () => {
    let response: [ResponseType<unknown, unknown, AdapterType>, ResponseDetailsType];
    const requestWithRetry = request
      .setRetry(1)
      .setRetryTime(50)
      .setMock([
        { data: { data: [1, 2, 3] }, status: 400, success: false },
        { data: { data: [1, 2, 3] }, status: 200 },
      ]);

    client.requestManager.events.onResponseByCache(requestWithRetry.cacheKey, (...rest) => {
      response = rest;
      delete (response[1] as Partial<ResponseDetailsType>).timestamp;
    });
    dispatcher.add(requestWithRetry);

    await waitFor(() => {
      expect(response).toBeDefined();
    });

    const adapterResponse: ResponseType<unknown, unknown, AdapterType> = {
      data: { data: [1, 2, 3] },
      error: null,
      status: 200,
      success: true,
      extra: {} as any,
    };
    const responseDetails: Omit<ResponseDetailsType, "timestamp"> = {
      retries: 1,
      isCanceled: false,
      isOffline: false,
    };

    await waitFor(() => {
      expect(response).toStrictEqual([adapterResponse, responseDetails]);
    });
  });

  it("should cycle through sequence if provided array of responses", async () => {
    const requestWithRetry = request.setMock([
      { data: { data: [1, 2, 3] }, status: 200 },
      { data: { data: [4, 5, 6] } },
    ]);

    const response1 = await requestWithRetry.send();
    const response2 = await requestWithRetry.send();
    const response3 = await requestWithRetry.send();
    const response4 = await requestWithRetry.send();

    expect(response1.data).toStrictEqual({ data: [1, 2, 3] });
    expect(response2.data).toStrictEqual({ data: [4, 5, 6] });
    expect(response2.status).toStrictEqual(200);
    expect(response3.data).toStrictEqual({ data: [1, 2, 3] });
    expect(response4.data).toStrictEqual({ data: [4, 5, 6] });
  });

  it("should allow for passing method to mock and return data conditionally", async () => {
    const mockedRequest = client
      .createRequest<any>()({ endpoint: "/users/:id" })
      .setMock((r) => {
        const { params } = r;
        if (params.id === 11) {
          return { data: [1, 2, 3], status: 222 };
        }
        return { data: [4, 5, 6] };
      });
    const response = await mockedRequest.send({ params: { id: 11 } } as any);
    const response2 = await mockedRequest.send({ params: { id: 13 } } as any);

    expect(response.data).toStrictEqual([1, 2, 3]);
    expect(response2.data).toStrictEqual([4, 5, 6]);
    expect(response.status).toStrictEqual(222);
    expect(response2.status).toStrictEqual(200);
  });

  it("should allow for passing async method to mock and return data conditionally", async () => {
    const mockedRequest = client
      .createRequest<Record<string, any>>()({ endpoint: "users/:id" })
      .setMock(async (r) => {
        if (r?.params?.id === 1) {
          return { data: [1, 2, 3], status: 222 };
        }
        return { data: [4, 5, 6] };
      });
    const response = await mockedRequest.send({ params: { id: 1 } } as any);
    const response2 = await mockedRequest.send({ params: { id: 2 } } as any);

    expect(response.data).toStrictEqual([1, 2, 3]);
    expect(response2.data).toStrictEqual([4, 5, 6]);
    expect(response.status).toStrictEqual(222);
    expect(response2.status).toStrictEqual(200);
  });

  it("should allow for passing multiple functions and cycle through them", async () => {
    const firstFunction = (r) => {
      if (r.params.id === 1) {
        return { data: [1, 2, 3] };
      }

      return { data: [4, 5, 6] };
    };
    const secondFunction = (r) => {
      if (r.params.id === 1) {
        return { data: [42, 42, 42] };
      }
      return { data: [19, 19, 19] };
    };
    const mockedRequest = client
      .createRequest<any>()({ endpoint: "users/:id" })
      .setMock([firstFunction, secondFunction]);

    const response1 = await mockedRequest.send({ params: { id: 1 } } as any);
    const response2 = await mockedRequest.send({ params: { id: 1 } } as any);
    const response3 = await mockedRequest.send({ params: { id: 1 } } as any);
    const response4 = await mockedRequest.send({ params: { id: 11 } } as any);
    const response5 = await mockedRequest.send({ params: { id: 12 } } as any);

    expect(response1.data).toStrictEqual([1, 2, 3]);
    expect(response2.data).toStrictEqual([42, 42, 42]);
    expect(response3.data).toStrictEqual([1, 2, 3]);
    expect(response4.data).toStrictEqual([19, 19, 19]);
    expect(response5.data).toStrictEqual([4, 5, 6]);
  });

  it("should allow for removing mocker and expecting normal behavior when executing request", async () => {
    const mockedRequest = client.createRequest<any>()({ endpoint: "shared-base-endpoint" }).setMock({ data: fixture });
    const response = await mockedRequest.send();

    mockedRequest.removeMock();
    const data = mockRequest(mockedRequest, { data: { data: [64, 64, 64] } });
    const response2 = await mockedRequest.send();

    expect(response).toStrictEqual({
      data: fixture,
      error: null,
      status: 200,
      success: true,
      extra: {},
    });
    expect(response2.data).toStrictEqual(data);
  });

  it("should allow for mocking extra", async () => {
    const mockedRequest = request.setMock({ data: fixture, extra: { someExtra: true } });
    const response = await mockedRequest.send();

    expect(response).toStrictEqual({
      data: fixture,
      error: null,
      status: 200,
      success: true,
      extra: { someExtra: true },
    });
  });

  it("should allow for setting status that is not a number", async () => {
    const mockedRequest = request.setMock({
      data: fixture,
      extra: { someExtra: true },
      status: "success",
    });
    const response = await mockedRequest.send();

    expect(response).toStrictEqual({
      data: fixture,
      error: null,
      status: "success",
      success: true,
      extra: { someExtra: true },
    });
  });

  it("should adjust responseTime and requestTime", async () => {
    const mockedRequest = request.setMock({
      data: fixture,
      config: { requestTime: 1000, responseTime: 1000 },
    });
    const startDate = +new Date();
    const response = await mockedRequest.send();
    const endDate = +new Date();
    expect(endDate - startDate).toBeGreaterThanOrEqual(2000);
    expect(response).toStrictEqual({
      data: fixture,
      error: null,
      status: 200,
      success: true,
      extra: {},
    });
  });

  it("should allow for setting totalUploaded and totalDownloaded", async () => {
    const mockedRequest = request.setMock({
      data: fixture,
      config: { totalUploaded: 1000, requestTime: 40, totalDownloaded: 1000, responseTime: 60 },
    });

    const requestSpy = jest.fn();
    const responseSpy = jest.fn();
    client.requestManager.events.onUploadProgressByQueue(request.queueKey, requestSpy);
    client.requestManager.events.onDownloadProgressByQueue(request.queueKey, responseSpy);
    const response = await mockedRequest.send();
    expect(requestSpy.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(responseSpy.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(response).toStrictEqual({
      data: fixture,
      error: null,
      status: 200,
      success: true,
      extra: {},
    });
  });

  it("should allow for toggling the mocker off and then turning it on again without removal", async () => {
    const mockedRequest = request.setMock({ data: fixture });
    const data = mockRequest(mockedRequest, { data: { data: [42, 42, 42] } });
    expect(mockedRequest.isMockEnabled).toBe(true);
    mockedRequest.setEnableMocking(false);
    expect(mockedRequest.isMockEnabled).toBe(false);
    const notMockedData = await mockedRequest.send();
    mockedRequest.setEnableMocking(true);
    const mockedData = await mockedRequest.send();

    expect(notMockedData).toStrictEqual({
      data,
      error: null,
      status: 200,
      success: true,
      extra: {
        headers: {
          "content-type": "application/json",
          "content-length": "19",
        },
      },
    });

    expect(mockedData).toStrictEqual({
      data: fixture,
      error: null,
      status: 200,
      success: true,
      extra: {},
    });
  });

  it("Should allow for globally turning on and off for all requests related to a client", async () => {
    const newClient = new Client({ url: "shared-base-url" }).setAdapter(() => adapter);
    const mockedRequest = newClient
      .createRequest<any>()({ endpoint: "shared-base-endpoint" })
      .setMock({ data: fixture });
    const data = mockRequest(mockedRequest, { data: { data: [42, 42, 42] } });

    expect(mockedRequest.isMockEnabled).toBe(true);
    expect(newClient.isMockEnabled).toBe(true);

    const mockedDataDefault = await mockedRequest.send();
    newClient.setEnableGlobalMocking(false);
    const notMockedData = await mockedRequest.send();
    newClient.setEnableGlobalMocking(true);
    const mockedDataAfter = await mockedRequest.send();

    expect(mockedDataDefault).toStrictEqual({
      data: fixture,
      error: null,
      status: 200,
      success: true,
      extra: {},
    });

    expect(mockedDataAfter).toStrictEqual({
      data: fixture,
      error: null,
      status: 200,
      success: true,
      extra: {},
    });

    expect(notMockedData).toStrictEqual({
      data,
      error: null,
      status: 200,
      success: true,
      extra: {
        headers: {
          "content-type": "application/json",
          "content-length": "19",
        },
      },
    });
  });
});

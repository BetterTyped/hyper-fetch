import { waitFor } from "@testing-library/dom";
import { createHttpMockingServer, sleep } from "@hyper-fetch/testing";

import { createAdapter, createDispatcher } from "../../utils";
import {
  HttpAdapterType,
  Client,
  getErrorMessage,
  RequestInstance,
  RequestResponseEventType,
  ResponseDetailsType,
  ResponseType,
  mocker,
} from "../../../src";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("Mocker [ Base ]", () => {
  const adapterSpy = jest.fn();
  const fixture = { test: 1, data: [200, 300, 404] };
  let adapter = createAdapter({ callback: adapterSpy });
  let client = new Client({ url: "shared-base-url" }).setAdapter(adapter);
  let dispatcher = createDispatcher(client);
  let request = client.createRequest<{ response: any }>()({ endpoint: "shared-base-endpoint" }).setMockingEnabled(true);

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetMocks();
    adapter = createAdapter({ callback: adapterSpy });
    client = new Client({ url: "shared-base-url" }).setAdapter(adapter);
    dispatcher = createDispatcher(client);
    request = client.createRequest<{ response: any }>()({ endpoint: "shared-base-endpoint" }).setMockingEnabled(true);

    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using exec method", () => {
    it("should return adapter response", async () => {
      const mockedRequest = request.setMock(() => ({ data: fixture, status: 200 }));
      const response = await mockedRequest.exec({});
      expect(response).toStrictEqual({
        data: fixture,
        error: null,
        status: 200,
        success: true,
        extra: request.client.adapter.defaultExtra,
        responseTimestamp: expect.toBeNumber(),
        requestTimestamp: expect.toBeNumber(),
      });
    });
  });
  describe("When using send method", () => {
    it("should return adapter response", async () => {
      const mockedRequest = request.setMock(() => ({ data: fixture, status: 200 }));
      const response = await mockedRequest.send({});

      expect(response).toStrictEqual({
        data: fixture,
        error: null,
        status: 200,
        success: true,
        extra: request.client.adapter.defaultExtra,
        responseTimestamp: expect.toBeNumber(),
        requestTimestamp: expect.toBeNumber(),
      });
    });
  });

  it("should return timeout error when request takes too long", async () => {
    const mockedRequest = client
      .createRequest<{ response: any }>()({ endpoint: "shared-base-endpoint" })
      .setMock(
        () => ({
          data: fixture,
          status: 200,
        }),
        { responseTime: 150, timeout: true },
      );

    const response = await mockedRequest.send({});

    expect(response.data).toBe(null);
    expect(response.error?.message).toEqual(getErrorMessage("timeout").message);
  });

  it("should allow to cancel single running request", async () => {
    const firstSpy = jest.fn();
    const secondSpy = jest.fn();
    const firstRequest = client
      .createRequest<{ response: any }>()({ endpoint: "shared-base-endpoint" })
      .setMock(
        () => ({
          data: fixture,
          status: 200,
        }),
        {
          responseTime: 150,
        },
      );
    const secondRequest = client
      .createRequest<{ response: any }>()({ endpoint: "shared-base-endpoint" })
      .setMock(
        () => ({
          data: fixture,
          status: 200,
        }),
        {
          responseTime: 150,
        },
      );

    dispatcher.add(secondRequest);
    const requestId = dispatcher.add(firstRequest);
    client.requestManager.events.onAbortById(requestId, firstSpy);
    client.requestManager.events.onAbortByKey(firstRequest.abortKey, secondSpy);

    await sleep(5);

    dispatcher.cancelRunningRequest(firstRequest.queryKey, requestId);

    expect(dispatcher.getRunningRequests(firstRequest.queryKey)).toHaveLength(1);
    expect(firstSpy).toHaveBeenCalledTimes(1);
    expect(secondSpy).toHaveBeenCalledTimes(1);
  });

  it("should allow for retrying request", async () => {
    let response: RequestResponseEventType<RequestInstance>;
    let index = 0;
    const fixtures = [
      { data: { data: [1, 2, 3] }, status: 400, success: false },
      { data: { data: [1, 2, 3] }, status: 200 },
    ];

    const requestWithRetry = request
      .setRetry(1)
      .setRetryTime(50)
      .setMock(() => {
        if (index === 1) {
          index = 0;
          return fixtures[1];
        }
        index = 1;
        return fixtures[0];
      });

    client.requestManager.events.onResponseByCache(requestWithRetry.cacheKey, (event) => {
      if (event.details.retries) {
        response = event;
      }
    });
    dispatcher.add(requestWithRetry);

    await waitFor(() => {
      expect(response).toBeDefined();
    });

    const adapterResponse: ResponseType<unknown, unknown, HttpAdapterType> = {
      data: { data: [1, 2, 3] },
      error: null,
      status: 200,
      success: true,
      extra: request.client.adapter.defaultExtra,
      requestTimestamp: expect.toBeNumber(),
      responseTimestamp: expect.toBeNumber(),
    };
    const responseDetails: Omit<ResponseDetailsType, "timestamp"> = {
      retries: 1,
      isCanceled: false,
      isOffline: false,
      requestTimestamp: expect.toBeNumber(),
      responseTimestamp: expect.toBeNumber(),
      addedTimestamp: expect.toBeNumber(),
      triggerTimestamp: expect.toBeNumber(),
    };

    await waitFor(() => {
      expect(response).toStrictEqual({
        requestId: expect.toBeString(),
        request: requestWithRetry,
        response: adapterResponse,
        details: responseDetails,
      });
    });
  });

  it("should cycle through sequence if provided array of responses", async () => {
    let index = 0;
    const fixtures = [
      { data: { data: [1, 2, 3] }, status: 200 },
      { data: { data: [4, 5, 6] }, status: 200 },
    ];

    const requestWithRetry = request.setMock(() => {
      if (index === 1) {
        index = 0;
        return fixtures[1];
      }
      index = 1;
      return fixtures[0];
    });

    const response1 = await requestWithRetry.send({});
    const response2 = await requestWithRetry.send({});
    const response3 = await requestWithRetry.send({});
    const response4 = await requestWithRetry.send({});

    expect(response1.data).toStrictEqual({ data: [1, 2, 3] });
    expect(response2.data).toStrictEqual({ data: [4, 5, 6] });
    expect(response2.status).toStrictEqual(200);
    expect(response3.data).toStrictEqual({ data: [1, 2, 3] });
    expect(response4.data).toStrictEqual({ data: [4, 5, 6] });
  });

  it("should allow for passing method to mock and return data conditionally", async () => {
    const mockedRequest = client.createRequest<{ response: any }>()({ endpoint: "/users/:id" });

    mockedRequest.setMock(({ request: req }) => {
      const { params } = req;
      if (params?.id === 11) {
        return { data: [1, 2, 3], status: 222 };
      }
      return { data: [4, 5, 6], status: 200 };
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
      .createRequest<{ response: Record<string, any> }>()({ endpoint: "users/:id" })
      .setMock(async ({ request: r }) => {
        if (r?.params?.id === 1) {
          return { data: [1, 2, 3], status: 222 };
        }
        return { data: [4, 5, 6], status: 200 };
      });
    const response = await mockedRequest.send({ params: { id: 1 } } as any);
    const response2 = await mockedRequest.send({ params: { id: 2 } } as any);

    expect(response.data).toStrictEqual([1, 2, 3]);
    expect(response2.data).toStrictEqual([4, 5, 6]);
    expect(response.status).toStrictEqual(222);
    expect(response2.status).toStrictEqual(200);
  });

  it("should allow for passing multiple functions and cycle through them", async () => {
    let index = 0;
    const firstFunction = (r: typeof mockedRequest) => {
      if (r.params?.id === 1) {
        return { data: [1, 2, 3], status: 200 };
      }

      return { data: [4, 5, 6], status: 200 };
    };
    const secondFunction = (r: typeof mockedRequest) => {
      if (r.params?.id === 1) {
        return { data: [42, 42, 42], status: 200 };
      }
      return { data: [19, 19, 19], status: 200 };
    };
    const mockedRequest = client
      .createRequest<{ response: any }>()({ endpoint: "users/:id" })
      .setMock(({ request: r }) => {
        if (index === 1) {
          index = 0;
          return secondFunction(r);
        }
        index = 1;
        return firstFunction(r);
      });

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
    const mockedRequest = client
      .createRequest<{ response: any }>()({ endpoint: "shared-base-endpoint" })
      .setMock(() => ({ data: fixture, status: 200 }));
    const response = await mockedRequest.send({});

    mockedRequest.clearMock();
    const data = mockRequest(mockedRequest, { data: { data: [64, 64, 64] } });
    const response2 = await mockedRequest.send({});

    expect(response).toStrictEqual({
      data: fixture,
      error: null,
      status: 200,
      success: true,
      extra: request.client.adapter.defaultExtra,
      requestTimestamp: expect.toBeNumber(),
      responseTimestamp: expect.toBeNumber(),
    });
    expect(response2.data).toStrictEqual(data);
  });

  it("should allow for mocking extra", async () => {
    const mockedRequest = request.setMock(() => ({
      data: fixture,
      extra: { headers: { something: "true" } },
      status: 213,
    }));
    const response = await mockedRequest.send({});

    expect(response).toStrictEqual({
      data: fixture,
      error: null,
      status: 213,
      success: true,
      extra: { headers: { something: "true" } },
      requestTimestamp: expect.toBeNumber(),
      responseTimestamp: expect.toBeNumber(),
    });
  });

  it("should allow for setting status that is not a number", async () => {
    const mockedRequest = request.setMock(() => ({
      data: fixture,
      extra: { someExtra: true } as any,
      status: "success" as any,
    }));
    const response = await mockedRequest.send({});

    expect(response).toStrictEqual({
      data: fixture,
      error: null,
      status: "success",
      success: true,
      extra: { someExtra: true },
      requestTimestamp: expect.toBeNumber(),
      responseTimestamp: expect.toBeNumber(),
    });
  });

  it("should adjust responseTime and requestTime", async () => {
    const mockedRequest = request.setMock(
      () => ({
        data: fixture,
        status: 200,
      }),
      { requestTime: 100, responseTime: 100 },
    );
    const startDate = +new Date();
    const response = await mockedRequest.send({});
    const endDate = +new Date();
    expect(endDate - startDate).toBeGreaterThanOrEqual(200);
    expect(response).toStrictEqual({
      data: fixture,
      error: null,
      status: 200,
      success: true,
      extra: request.client.adapter.defaultExtra,
      requestTimestamp: expect.toBeNumber(),
      responseTimestamp: expect.toBeNumber(),
    });
  });

  it("should allow for setting totalUploaded and totalDownloaded", async () => {
    const mockedRequest = request.setMock(
      () => ({
        data: fixture,
        status: 200,
      }),
      { totalUploaded: 1000, requestTime: 40, totalDownloaded: 1000, responseTime: 60 },
    );

    const requestSpy = jest.fn();
    const responseSpy = jest.fn();
    client.requestManager.events.onUploadProgressByQueue(request.queryKey, requestSpy);
    client.requestManager.events.onDownloadProgressByQueue(request.queryKey, responseSpy);
    const response = await mockedRequest.send({});
    expect(requestSpy.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(responseSpy.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(response).toStrictEqual({
      data: fixture,
      error: null,
      status: 200,
      success: true,
      extra: request.client.adapter.defaultExtra,
      requestTimestamp: expect.toBeNumber(),
      responseTimestamp: expect.toBeNumber(),
    });
  });

  it("should allow for toggling the mocker off and then turning it on again without removal", async () => {
    const mockedRequest = request.setMock(() => ({ data: fixture, status: 200 }));
    const data = mockRequest(mockedRequest, { data: { data: [42, 42, 42] } });
    expect(mockedRequest.isMockerEnabled).toBe(true);
    mockedRequest.setMockingEnabled(false);
    expect(mockedRequest.isMockerEnabled).toBe(false);
    const notMockedData = await mockedRequest.send({});
    mockedRequest.setMockingEnabled(true);
    const mockedData = await mockedRequest.send({});

    expect(notMockedData).toStrictEqual({
      data,
      error: null,
      status: 200,
      success: true,
      extra: {
        headers: {
          "content-length": "19",
          "content-type": "application/json",
        },
      },
      requestTimestamp: expect.toBeNumber(),
      responseTimestamp: expect.toBeNumber(),
    });

    expect(mockedData).toStrictEqual({
      data: fixture,
      error: null,
      status: 200,
      success: true,
      extra: request.client.adapter.defaultExtra,
      requestTimestamp: expect.toBeNumber(),
      responseTimestamp: expect.toBeNumber(),
    });
  });

  it("Should allow for globally turning on and off for all requests related to a client", async () => {
    const newClient = new Client({ url: "shared-base-url" }).setAdapter(adapter);
    const mockedRequest = newClient
      .createRequest<{ response: any }>()({ endpoint: "shared-base-endpoint" })
      .setMock(() => ({ data: fixture, status: 200 }));
    const data = mockRequest(mockedRequest, { data: { data: [42, 42, 42] } });

    expect(mockedRequest.isMockerEnabled).toBe(true);
    expect(newClient.isMockerEnabled).toBe(true);

    const mockedDataDefault = await mockedRequest.send({});
    newClient.setEnableGlobalMocking(false);
    const notMockedData = await mockedRequest.send({});
    newClient.setEnableGlobalMocking(true);
    const mockedDataAfter = await mockedRequest.send({});

    expect(mockedDataDefault).toStrictEqual({
      data: fixture,
      error: null,
      status: 200,
      success: true,
      extra: request.client.adapter.defaultExtra,
      requestTimestamp: expect.toBeNumber(),
      responseTimestamp: expect.toBeNumber(),
    });

    expect(mockedDataAfter).toStrictEqual({
      data: fixture,
      error: null,
      status: 200,
      success: true,
      extra: request.client.adapter.defaultExtra,
      requestTimestamp: expect.toBeNumber(),
      responseTimestamp: expect.toBeNumber(),
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
      requestTimestamp: expect.toBeNumber(),
      responseTimestamp: expect.toBeNumber(),
    });
  });

  it("should throw error when mock is not defined", async () => {
    await expect(
      mocker({
        request: client.createRequest<{ response: any }>()({ endpoint: "shared-base-endpoint" }),
      } as any),
    ).rejects.toThrow("Request processing error");
  });

  describe("When handling different response scenarios", () => {
    it("should handle success with data", async () => {
      const mockedRequest = request.setMock(() => ({
        data: fixture,
        status: 200,
        success: true,
      }));

      const response = await mockedRequest.send({});

      expect(response).toStrictEqual({
        data: fixture,
        error: null,
        status: 200,
        success: true,
        extra: request.client.adapter.defaultExtra,
        requestTimestamp: expect.toBeNumber(),
        responseTimestamp: expect.toBeNumber(),
      });
    });

    it("should handle error with data", async () => {
      const data = { message: "Error occurred", code: 400 };
      const mockedRequest = request.setMock(() => ({
        data,
        error: new Error("Test error"),
        status: 400,
        success: true,
      }));

      const response = await mockedRequest.send({});

      expect(response).toStrictEqual({
        data,
        error: expect.any(Error),
        status: 400,
        success: true,
        extra: request.client.adapter.defaultExtra,
        requestTimestamp: expect.toBeNumber(),
        responseTimestamp: expect.toBeNumber(),
      });
    });

    it("should handle error without data", async () => {
      const mockedRequest = request.setMock(() => ({
        data: null,
        error: new Error("Test error"),
        status: 500,
        success: false,
      }));

      const response = await mockedRequest.send({});

      expect(response).toStrictEqual({
        data: null,
        error: expect.any(Error),
        status: 500,
        success: false,
        extra: request.client.adapter.defaultExtra,
        requestTimestamp: expect.toBeNumber(),
        responseTimestamp: expect.toBeNumber(),
      });
    });
  });
});

import { waitFor } from "@testing-library/dom";

import { createAdapter, createDispatcher, sleep } from "../../utils";
import {
  BaseAdapterType,
  Client,
  getErrorMessage,
  ResponseDetailsType,
  ResponseReturnType,
  xhrAdditionalData,
} from "../../../src";
import { createRequestInterceptor, resetInterceptors, startServer, stopServer } from "../../server";

describe("Mocker [ Base ]", () => {
  const adapterSpy = jest.fn();
  const fixture = { test: 1, data: [200, 300, 404] };
  let adapter = createAdapter({ callback: adapterSpy });
  let client = new Client({ url: "shared-base-url" }).setAdapter(() => adapter);
  let dispatcher = createDispatcher(client);
  let request = client.createRequest()({ endpoint: "shared-base-endpoint" });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetInterceptors();
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
      const requestExecution = mockedRequest.exec({});
      const response = await requestExecution;
      expect(response).toStrictEqual({
        data: fixture,
        error: null,
        status: 200,
        isSuccess: true,
        additionalData: xhrAdditionalData,
      });
    });
  });
  describe("When using request's send method", () => {
    it("should return adapter response", async () => {
      const mockedRequest = request.setMock({ data: fixture });
      const response = await mockedRequest.send({});

      expect(response).toStrictEqual({
        data: fixture,
        error: null,
        status: 200,
        isSuccess: true,
        additionalData: xhrAdditionalData,
      });
    });
  });

  it("should return timeout error when request takes too long", async () => {
    const mockedRequest = client
      .createRequest()({ endpoint: "shared-base-endpoint", options: { timeout: 10 } })
      .setMock({
        data: fixture,
        config: { responseDelay: 1500 },
      });

    const response = await mockedRequest.send({});

    expect(response.data).toBe(null);
    expect(response.error.message).toEqual(getErrorMessage("timeout").message);
  });

  it("should allow to cancel single running request", async () => {
    const firstSpy = jest.fn();
    const secondSpy = jest.fn();
    const firstRequest = client
      .createRequest()({ endpoint: "shared-base-endpoint" })
      .setMock({
        data: fixture,
        config: {
          responseDelay: 1500,
        },
      });
    const secondRequest = client
      .createRequest()({ endpoint: "shared-base-endpoint" })
      .setMock({
        data: fixture,
        config: {
          responseDelay: 1500,
        },
      });

    dispatcher.add(secondRequest);
    const requestId = dispatcher.add(firstRequest);
    client.requestManager.events.onAbortById(requestId, firstSpy);
    client.requestManager.events.onAbort(firstRequest.abortKey, secondSpy);

    await sleep(5);

    dispatcher.cancelRunningRequest(firstRequest.queueKey, requestId);

    expect(dispatcher.getRunningRequests(firstRequest.queueKey)).toHaveLength(1);
    expect(firstSpy).toBeCalledTimes(1);
    expect(secondSpy).toBeCalledTimes(1);
  });

  it("Should allow for retrying request", async () => {
    let response: [ResponseReturnType<unknown, unknown, BaseAdapterType>, ResponseDetailsType];
    const requestWithRetry = request
      .setRetry(1)
      .setRetryTime(50)
      .setMock([
        { data: { data: [1, 2, 3] }, config: { status: 400 } },
        { data: { data: [1, 2, 3] }, config: { status: 200 } },
      ]);

    client.requestManager.events.onResponse(requestWithRetry.cacheKey, (...rest) => {
      response = rest;
      delete (response[1] as Partial<ResponseDetailsType>).timestamp;
    });
    dispatcher.add(requestWithRetry);

    await waitFor(() => {
      expect(response).toBeDefined();
    });

    const adapterResponse: ResponseReturnType<unknown, unknown, BaseAdapterType> = {
      data: { data: [1, 2, 3] },
      error: null,
      status: 200,
      isSuccess: true,
      additionalData: xhrAdditionalData,
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
      { data: { data: [1, 2, 3] }, config: { status: 200 } },
      { data: { data: [4, 5, 6] }, config: { status: 200 } },
    ]);

    const response1 = await requestWithRetry.send();
    const response2 = await requestWithRetry.send();
    const response3 = await requestWithRetry.send();
    const response4 = await requestWithRetry.send();

    expect(response1.data).toStrictEqual({ data: [1, 2, 3] });
    expect(response2.data).toStrictEqual({ data: [4, 5, 6] });
    expect(response3.data).toStrictEqual({ data: [1, 2, 3] });
    expect(response4.data).toStrictEqual({ data: [4, 5, 6] });
  });

  it("should allow for passing method to mock and return data conditionally", async () => {
    const mockedRequest = client
      .createRequest()({ endpoint: "/users/:id" })
      .setMock((r) => {
        // TODO - can we fix types here to somehow indicate that it is not 'null'?
        const params = r.params as any;
        if (params.id === 11) {
          return { data: [1, 2, 3], config: { status: 222 } };
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
          return { data: [1, 2, 3], config: { status: 222 } };
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
    const mockedRequest = client.createRequest()({ endpoint: "users/:id" }).setMock([firstFunction, secondFunction]);

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
    const mockedRequest = client.createRequest()({ endpoint: "shared-base-endpoint" }).setMock({ data: fixture });
    const response = await mockedRequest.send({});

    mockedRequest.removeMock();
    const data = createRequestInterceptor(mockedRequest, { fixture: { data: [64, 64, 64] } });
    const response2 = await mockedRequest.send({});

    expect(response).toStrictEqual({
      data: fixture,
      error: null,
      status: 200,
      isSuccess: true,
      additionalData: xhrAdditionalData,
    });
    expect(response2.data).toStrictEqual(data);
  });
});

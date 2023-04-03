import { createAdapter, createClient, createDispatcher, createRequest, sleep } from "../../utils";
import { BaseAdapterType, getErrorMessage, ResponseDetailsType, ResponseReturnType } from "../../../src";
import { createRequestInterceptor } from "../../server";
import { waitFor } from "@testing-library/dom";
describe("Request [ Mocking ]", () => {
  const adapterSpy = jest.fn();
  const fixture = { test: 1, data: [1, 2, 3] };
  let adapter = createAdapter({ callback: adapterSpy });
  let client = createClient().setAdapter(() => adapter);
  let dispatcher = createDispatcher(client);
  let request = createRequest(client);

  beforeEach(() => {
    adapter = createAdapter({ callback: adapterSpy });
    client = createClient().setAdapter(() => adapter);
    dispatcher = createDispatcher(client);
    request = createRequest(client);

    jest.resetAllMocks();
  });

  describe("When using request's exec method", () => {
    it("should return adapter response", async () => {
      const mockedRequest = request.setMock({ data: fixture });
      const requestExecution = mockedRequest.exec({});
      const response = await requestExecution;
      expect(response).toStrictEqual({ data: fixture, error: null, status: 200, isSuccess: true, additionalData: {} });
    });
  });
  describe("When using request's send method", () => {
    it("should return adapter response", async () => {
      const mockedRequest = request.setMock({ data: fixture });
      const response = await mockedRequest.send({});

      expect(response).toStrictEqual({ data: fixture, error: null, status: 200, isSuccess: true, additionalData: {} });
    });
  });

  it("should return timeout error when request takes too long", async () => {
    const mockedRequest = createRequest(client).setMock({
      data: fixture,
      config: { responseDelay: 1500, timeout: true },
    });

    const response = await mockedRequest.send({});

    expect(response.data).toBe(null);
    expect(response.error.message).toEqual(getErrorMessage("timeout").message);
  });

  it("should allow to cancel single running request", async () => {
    const firstSpy = jest.fn();
    const secondSpy = jest.fn();
    const firstRequest = createRequest(client).setMock({
      data: fixture,
      config: {
        responseDelay: 1500,
      },
    });
    const secondRequest = createRequest(client).setMock({
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
      additionalData: {},
    };
    const responseDetails: Omit<ResponseDetailsType, "timestamp"> = {
      retries: 1,
      isSuccess: true,
      isCanceled: false,
      isOffline: false,
    };

    await waitFor(() => {
      expect(response).toStrictEqual([adapterResponse, responseDetails]);
    });
  });
});

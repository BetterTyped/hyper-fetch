import { act } from "@testing-library/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { testErrorState, testSuccessState } from "../../shared";
import { client, createRequest, renderUseFetch, renderUseSubmit } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useFetch [ refetch ]", () => {
  let requestSubmit = createRequest<null, null>({ method: "POST" });
  let requestFetch = createRequest({ endpoint: "fetch-test" });

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(() => {
    jest.resetModules();
    client.clear();
    requestSubmit = createRequest({ method: "POST" });
    requestFetch = createRequest({ endpoint: "fetch-test" });
  });

  it("should allow to refetch other request on finished", async () => {
    const submitMock = mockRequest(requestSubmit);
    const errorFetchMock = mockRequest(requestFetch, { status: 400 });
    const responseSubmit = renderUseSubmit(requestSubmit);
    const responseFetch = renderUseFetch(requestFetch);

    await testErrorState(errorFetchMock, responseFetch);
    const fetchMock = mockRequest(requestFetch);

    act(() => {
      responseSubmit.result.current.onSubmitFinished(() => {
        responseSubmit.result.current.refetch(requestFetch);
      });
      responseSubmit.result.current.submit();
    });

    await testSuccessState(submitMock, responseSubmit);
    await testSuccessState(fetchMock, responseFetch);
  });
  it("should allow to refetch by Request", async () => {
    const spy = jest.spyOn(client.cache, "invalidate");

    const { result } = renderUseSubmit(requestSubmit);

    act(() => {
      result.current.refetch(requestSubmit);
    });

    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(requestSubmit.cacheKey);
  });
  it("should allow to refetch by RegExp", async () => {
    const spy = jest.spyOn(client.cache, "invalidate");

    const { result } = renderUseSubmit(requestSubmit);

    act(() => {
      result.current.refetch(new RegExp(requestSubmit.cacheKey));
    });

    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(new RegExp(requestSubmit.cacheKey));
  });
  it("should allow to refetch by cacheKey", async () => {
    const spy = jest.spyOn(client.cache, "invalidate");

    const { result } = renderUseSubmit(requestSubmit);

    act(() => {
      result.current.refetch(requestSubmit.cacheKey);
    });

    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(requestSubmit.cacheKey);
  });
  it("should allow to refetch by cacheKey", async () => {
    const spy = jest.spyOn(client.cache, "invalidate");

    const { result } = renderUseSubmit(requestSubmit);

    act(() => {
      result.current.refetch([requestSubmit.cacheKey]);
    });

    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(requestSubmit.cacheKey);
  });
  it("should not allow to refetch without key", async () => {
    const spy = jest.spyOn(client.cache, "invalidate");

    const { result } = renderUseSubmit(requestSubmit);

    act(() => {
      result.current.refetch(undefined);
    });

    expect(spy).toBeCalledTimes(0);
  });
});

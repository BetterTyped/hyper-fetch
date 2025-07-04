import { act } from "@testing-library/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { testErrorState, testSuccessState } from "../../shared";
import { client, createRequest, renderUseFetch, renderUseSubmit } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

// Todo: refactor all tests after changes in the refetch function
describe("useFetch [ refetch ]", () => {
  let requestSubmit = createRequest<{ response: null; payload: null }>({ method: "POST" });
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
        requestFetch.client.cache.invalidate(requestFetch);
      });
      responseSubmit.result.current.submit();
    });

    await testSuccessState(submitMock, responseSubmit);
    await testSuccessState(fetchMock, responseFetch);
  });
  it("should allow to refetch by Request", async () => {
    const spy = jest.spyOn(client.cache, "invalidate");

    renderUseSubmit(requestSubmit);

    act(() => {
      client.cache.invalidate(requestSubmit);
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(requestSubmit);
  });
  it("should allow to refetch by RegExp", async () => {
    const spy = jest.spyOn(client.cache, "invalidate");

    renderUseSubmit(requestSubmit);

    act(() => {
      client.cache.invalidate(new RegExp(requestSubmit.cacheKey));
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(new RegExp(requestSubmit.cacheKey));
  });
  it("should allow to refetch by cacheKey", async () => {
    const spy = jest.spyOn(client.cache, "invalidate");

    renderUseSubmit(requestSubmit);

    act(() => {
      client.cache.invalidate(requestSubmit.cacheKey);
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(requestSubmit.cacheKey);
  });
  it("should allow to refetch without key", async () => {
    const spy = jest.spyOn(client.cache, "invalidate");

    const { result } = renderUseSubmit(requestSubmit);

    act(() => {
      result.current.refetch();
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });
});

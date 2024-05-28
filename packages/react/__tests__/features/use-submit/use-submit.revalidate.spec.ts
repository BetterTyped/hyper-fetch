import { act } from "@testing-library/react";

import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { testErrorState, testSuccessState } from "../../shared";
import { client, createRequest, renderUseFetch, renderUseSubmit } from "../../utils";

describe("useFetch [ refetch ]", () => {
  let requestSubmit = createRequest<null, null>({ method: "POST" });
  let requestFetch = createRequest({ endpoint: "fetch-test" });

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetInterceptors();
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
    const submitMock = createRequestInterceptor(requestSubmit);
    const errorFetchMock = createRequestInterceptor(requestFetch, { status: 400 });
    const responseSubmit = renderUseSubmit(requestSubmit);
    const responseFetch = renderUseFetch(requestFetch);

    await testErrorState(errorFetchMock, responseFetch);
    const fetchMock = createRequestInterceptor(requestFetch);

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
      result.current.refetch(undefined as string);
    });

    expect(spy).toBeCalledTimes(0);
  });
});

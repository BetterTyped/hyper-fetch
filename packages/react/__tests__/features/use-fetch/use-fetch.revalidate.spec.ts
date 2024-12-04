import { xhrExtra } from "@hyper-fetch/core";
import { act } from "@testing-library/react";

import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { testSuccessState } from "../../shared";
import { client, createRequest, renderUseFetch, sleep, waitForRender } from "../../utils";

describe("useFetch [ refetch ]", () => {
  let request = createRequest();
  let mock = createRequestInterceptor(request);

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
    request = createRequest();
    client.clear();
    mock = createRequestInterceptor(request);
  });

  it("should allow to prevent invalidation on mount", async () => {
    const spy = jest.fn();
    const customMock = { something: "123" };
    client.cache.set(request, {
      data: customMock,
      error: null,
      status: 200,
      success: true,
      extra: { headers: { "content-type": "application/json", "x-powered-by": "msw" } },
      retries: 0,
      timestamp: +new Date(),
      isCanceled: false,
      isOffline: false,
    });

    const response = renderUseFetch(request, { revalidate: false });
    act(() => {
      response.result.current.onFinished(spy);
    });

    await testSuccessState(customMock, response);
    await sleep(50);
    expect(spy).toBeCalledTimes(0);
  });
  it("should allow to prevent invalidation on mount", async () => {
    const spy = jest.fn();
    const response = renderUseFetch(request, { revalidate: false });

    act(() => {
      response.result.current.onFinished(() => {
        spy();
        response.unmount();
      });
    });
    renderUseFetch(request, { revalidate: false });

    await waitForRender(50);
    expect(spy).toBeCalledTimes(1);
  });
  it("should allow to refetch on mount", async () => {
    const customMock = { something: "123" };
    client.cache.set(request, {
      data: customMock,
      error: null,
      status: 200,
      success: true,
      extra: xhrExtra,
      retries: 0,
      timestamp: +new Date(),
      isCanceled: false,
      isOffline: false,
    });

    const response = renderUseFetch(request, { revalidate: true });

    await testSuccessState(mock, response);
  });
  it("should allow to refetch current hook", async () => {
    const response = renderUseFetch(request);

    await testSuccessState(mock, response);
    const customMock = createRequestInterceptor(request, { fixture: { something: 123 } });

    act(() => {
      response.result.current.refetch();
    });

    await testSuccessState(customMock, response);
  });
  it("should allow to refetch hook by RegExp", async () => {
    const regexp = /(Maciej|Kacper)/;

    const responseOne = renderUseFetch(request.setCacheKey("Maciej"));
    const responseTwo = renderUseFetch(request.setCacheKey("Kacper"));

    await testSuccessState(mock, responseOne);
    await testSuccessState(mock, responseTwo);

    const customMock = createRequestInterceptor(request, { fixture: { something: 123 } });

    act(() => {
      responseOne.result.current.refetch(regexp);
    });

    await testSuccessState(customMock, responseOne);
    await testSuccessState(customMock, responseTwo);
  });
  it("should allow to refetch hook by keys array", async () => {
    const responseOne = renderUseFetch(request.setCacheKey("Maciej"));
    const responseTwo = renderUseFetch(request.setCacheKey("Kacper"));

    await testSuccessState(mock, responseOne);
    await testSuccessState(mock, responseTwo);
    const customMock = createRequestInterceptor(request, { fixture: { something: 123 } });

    act(() => {
      responseOne.result.current.refetch(["Maciej"]);
    });

    await testSuccessState(customMock, responseOne);
    await testSuccessState(mock, responseTwo);
  });
  it("should allow to refetch hook by key", async () => {
    const responseOne = renderUseFetch(request.setCacheKey("Maciej"));
    const responseTwo = renderUseFetch(request.setCacheKey("Kacper"));

    await testSuccessState(mock, responseOne);
    await testSuccessState(mock, responseTwo);
    const customMock = createRequestInterceptor(request, { fixture: { something: 123 } });

    act(() => {
      responseOne.result.current.refetch("Maciej");
    });

    await testSuccessState(customMock, responseOne);
    await testSuccessState(mock, responseTwo);
  });
  it("should allow to refetch hook by request", async () => {
    const responseOne = renderUseFetch(request.setQueryParams("?something=123"));
    const responseTwo = renderUseFetch(request.setQueryParams("?other=999"));

    await testSuccessState(mock, responseOne);
    await testSuccessState(mock, responseTwo);
    const customMock = createRequestInterceptor(request, { fixture: { something: 123 } });

    act(() => {
      responseOne.result.current.refetch(request.setQueryParams("?something=123"));
    });

    await testSuccessState(customMock, responseOne);
    await testSuccessState(mock, responseTwo);
  });
  it("should not refetch while toggling query", async () => {
    const spy = jest.fn();

    const revalidateRequest = createRequest({ endpoint: "123-revalidate" });
    const revalidateMock = createRequestInterceptor(revalidateRequest, { fixture: { something: 123 } });

    // First request
    const response = renderUseFetch(request, { revalidate: false });

    response.result.current.onFinished(() => {
      spy();
    });

    await testSuccessState(mock, response);
    expect(spy).toBeCalledTimes(1);

    act(() => {
      // Second request
      response.rerender({ request: revalidateRequest, revalidate: false });
    });

    await testSuccessState(revalidateMock, response);
    expect(spy).toBeCalledTimes(2);

    // Check revalidation

    act(() => {
      // Third request
      response.rerender({ request, revalidate: false });
    });
    await testSuccessState(mock, response);

    act(() => {
      // Fourth request
      response.rerender({ request: revalidateRequest, revalidate: false });
    });

    await testSuccessState(revalidateMock, response);
    expect(spy).toBeCalledTimes(2);
  });
});

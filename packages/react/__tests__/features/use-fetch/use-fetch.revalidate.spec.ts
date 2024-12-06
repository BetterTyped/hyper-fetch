import { xhrExtra } from "@hyper-fetch/core";
import { act, waitFor } from "@testing-library/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { testSuccessState } from "../../shared";
import { client, createRequest, renderUseFetch, sleep, waitForRender } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useFetch [ refetch ]", () => {
  let request = createRequest();
  let mock = mockRequest(request);

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
    request = createRequest();
    client.clear();
    mock = mockRequest(request);
  });

  it("should allow to prevent invalidation on mount", async () => {
    const spy = jest.fn();
    const customMock = { something: "123" };
    client.cache.set(request, {
      data: customMock,
      error: null,
      status: 200,
      success: true,
      extra: { headers: { "content-type": "application/json" } },
      retries: 0,
      addedTimestamp: +new Date(),
      triggerTimestamp: +new Date(),
      requestTimestamp: +new Date(),
      responseTimestamp: +new Date(),
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
      addedTimestamp: +new Date(),
      triggerTimestamp: +new Date(),
      requestTimestamp: +new Date(),
      responseTimestamp: +new Date(),
      isCanceled: false,
      isOffline: false,
    });

    const response = renderUseFetch(request, { revalidate: true });

    await waitFor(async () => {
      await testSuccessState(mock, response);
    });
  });
  it("should allow to refetch current hook", async () => {
    const response = renderUseFetch(request);

    await waitFor(async () => {
      await testSuccessState(mock, response);
    });
    const customMock = mockRequest(request, { data: { something: 123 } });

    act(() => {
      response.result.current.refetch();
    });

    await waitFor(async () => {
      await testSuccessState(customMock, response);
    });
  });
  it("should allow to refetch hook by RegExp", async () => {
    const regexp = /(Maciej|Kacper)/;
    const responseOne = renderUseFetch(request.setCacheKey("Maciej"));
    const responseTwo = renderUseFetch(request.setCacheKey("Kacper"));

    await waitFor(async () => {
      await testSuccessState(mock, responseOne);
      await testSuccessState(mock, responseTwo);
    });
    const customMock = mockRequest(request, { data: { something: 123 } });

    act(() => {
      client.cache.invalidate(regexp);
    });

    await waitFor(async () => {
      await testSuccessState(customMock, responseOne);
      await testSuccessState(customMock, responseTwo);
    });
  });
  it("should allow to refetch hook by keys array", async () => {
    const responseOne = renderUseFetch(request.setCacheKey("Maciej"));
    const responseTwo = renderUseFetch(request.setCacheKey("Kacper"));

    await waitFor(async () => {
      await testSuccessState(mock, responseOne);
      await testSuccessState(mock, responseTwo);
    });
    const customMock = mockRequest(request, { data: { something: 123 } });

    act(() => {
      client.cache.invalidate(["Maciej"]);
    });

    await waitFor(async () => {
      await testSuccessState(customMock, responseOne);
      await testSuccessState(mock, responseTwo);
    });
  });
  it("should allow to refetch hook by key", async () => {
    const responseOne = renderUseFetch(request.setCacheKey("Maciej"));
    const responseTwo = renderUseFetch(request.setCacheKey("Kacper"));

    await waitFor(async () => {
      await testSuccessState(mock, responseOne);
      await testSuccessState(mock, responseTwo);
    });
    const customMock = mockRequest(request, { data: { something: 123 } });

    act(() => {
      client.cache.invalidate("Maciej");
    });

    await waitFor(async () => {
      await testSuccessState(customMock, responseOne);
      await testSuccessState(mock, responseTwo);
    });
  });
  it("should allow to refetch hook by request", async () => {
    const responseOne = renderUseFetch(request.setQueryParams("?something=123"));
    const responseTwo = renderUseFetch(request.setQueryParams("?other=999"));

    await waitFor(async () => {
      await testSuccessState(mock, responseOne);
      await testSuccessState(mock, responseTwo);
    });
    const customMock = mockRequest(request, { data: { something: 123 } });

    act(() => {
      client.cache.invalidate(request.setQueryParams("?something=123"));
    });

    await waitFor(async () => {
      await testSuccessState(customMock, responseOne);
      await testSuccessState(mock, responseTwo);
    });
  });
  it("should not refetch while toggling query", async () => {
    const spy = jest.fn();

    const revalidateRequest = createRequest({ endpoint: "123-revalidate" });
    const revalidateMock = mockRequest(revalidateRequest, { data: { something: 123 } });

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

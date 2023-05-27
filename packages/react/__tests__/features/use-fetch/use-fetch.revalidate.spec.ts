import { xhrExtra } from "@hyper-fetch/core";
import { act, waitFor } from "@testing-library/react";

import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { testSuccessState } from "../../shared";
import { client, createRequest, renderUseFetch, sleep, waitForRender } from "../../utils";

describe("useFetch [ Invalidate ]", () => {
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

    const response = renderUseFetch(request, { fetchOnMount: false });
    act(() => {
      response.result.current.onFinished(spy);
    });

    await testSuccessState(customMock, response);
    await sleep(50);
    expect(spy).toBeCalledTimes(0);
  });
  it("should allow to prevent invalidation on mount", async () => {
    const spy = jest.fn();
    const response = renderUseFetch(request, { fetchOnMount: false });

    act(() => {
      response.result.current.onFinished(() => {
        spy();
        response.unmount();
      });
    });
    renderUseFetch(request, { fetchOnMount: false });

    await waitForRender(50);
    expect(spy).toBeCalledTimes(1);
  });
  it("should allow to invalidate on mount", async () => {
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

    const response = renderUseFetch(request, { fetchOnMount: true });

    await waitFor(async () => {
      await testSuccessState(mock, response);
    });
  });
  it("should allow to invalidate current hook", async () => {
    const response = renderUseFetch(request);

    await waitFor(async () => {
      await testSuccessState(mock, response);
    });
    const customMock = createRequestInterceptor(request, { fixture: { something: 123 } });

    act(() => {
      response.result.current.invalidate();
    });

    await waitFor(async () => {
      await testSuccessState(customMock, response);
    });
  });
  it("should allow to invalidate hook by RegExp", async () => {
    const regexp = /(Maciej|Kacper)/;
    const responseOne = renderUseFetch(request.setCacheKey("Maciej"));
    const responseTwo = renderUseFetch(request.setCacheKey("Kacper"));

    await waitFor(async () => {
      await testSuccessState(mock, responseOne);
      await testSuccessState(mock, responseTwo);
    });
    const customMock = createRequestInterceptor(request, { fixture: { something: 123 } });

    act(() => {
      responseOne.result.current.invalidate(regexp);
    });

    await waitFor(async () => {
      await testSuccessState(customMock, responseOne);
      await testSuccessState(customMock, responseTwo);
    });
  });
  it("should allow to invalidate hook by keys array", async () => {
    const responseOne = renderUseFetch(request.setCacheKey("Maciej"));
    const responseTwo = renderUseFetch(request.setCacheKey("Kacper"));

    await waitFor(async () => {
      await testSuccessState(mock, responseOne);
      await testSuccessState(mock, responseTwo);
    });
    const customMock = createRequestInterceptor(request, { fixture: { something: 123 } });

    act(() => {
      responseOne.result.current.invalidate(["Maciej"]);
    });

    await waitFor(async () => {
      await testSuccessState(customMock, responseOne);
      await testSuccessState(mock, responseTwo);
    });
  });
  it("should allow to invalidate hook by key", async () => {
    const responseOne = renderUseFetch(request.setCacheKey("Maciej"));
    const responseTwo = renderUseFetch(request.setCacheKey("Kacper"));

    await waitFor(async () => {
      await testSuccessState(mock, responseOne);
      await testSuccessState(mock, responseTwo);
    });
    const customMock = createRequestInterceptor(request, { fixture: { something: 123 } });

    act(() => {
      responseOne.result.current.invalidate("Maciej");
    });

    await waitFor(async () => {
      await testSuccessState(customMock, responseOne);
      await testSuccessState(mock, responseTwo);
    });
  });
  it("should allow to invalidate hook by request", async () => {
    const responseOne = renderUseFetch(request.setQueryParams("?something=123"));
    const responseTwo = renderUseFetch(request.setQueryParams("?other=999"));

    await waitFor(async () => {
      await testSuccessState(mock, responseOne);
      await testSuccessState(mock, responseTwo);
    });
    const customMock = createRequestInterceptor(request, { fixture: { something: 123 } });

    act(() => {
      responseOne.result.current.invalidate(request.setQueryParams("?something=123"));
    });

    await waitFor(async () => {
      await testSuccessState(customMock, responseOne);
      await testSuccessState(mock, responseTwo);
    });
  });
});

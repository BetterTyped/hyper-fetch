import { act, waitFor } from "@testing-library/react";

import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { testSuccessState } from "../../shared";
import { client, createRequest, renderUseFetch, sleep } from "../../utils";

describe("useFetch [ Revalidate ]", () => {
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

  it("should allow to prevent revalidation on mount", async () => {
    const spy = jest.fn();
    const customMock = { something: "123" };
    client.cache.set(
      request,
      { data: customMock, error: null, status: 200, additionalData: {} },
      {
        retries: 0,
        timestamp: +new Date(),
        isFailed: false,
        isCanceled: false,
        isOffline: false,
      },
    );

    const response = renderUseFetch(request, { revalidateOnMount: false });
    act(() => {
      response.result.current.onFinished(spy);
    });

    await testSuccessState(customMock, response);
    await sleep(50);
    expect(spy).toBeCalledTimes(0);
  });
  it("should allow to prevent revalidation on mount", async () => {
    const spy = jest.fn();
    const response = renderUseFetch(request, { revalidateOnMount: false });
    act(() => {
      response.result.current.onFinished(() => {
        spy();
        response.unmount();
      });
    });
    renderUseFetch(request, { revalidateOnMount: false });

    await sleep(50);
    expect(spy).toBeCalledTimes(1);
  });
  it("should allow to revalidate on mount", async () => {
    const customMock = { something: "123" };
    client.cache.set(
      request,
      { data: customMock, error: null, status: 200, additionalData: {} },
      {
        retries: 0,
        timestamp: +new Date(),
        isFailed: false,
        isCanceled: false,
        isOffline: false,
      },
    );

    const response = renderUseFetch(request, { revalidateOnMount: true });

    await waitFor(async () => {
      await testSuccessState(mock, response);
    });
  });
  it("should allow to revalidate current hook", async () => {
    const response = renderUseFetch(request);

    await waitFor(async () => {
      await testSuccessState(mock, response);
    });
    const customMock = createRequestInterceptor(request, { fixture: { something: 123 } });

    act(() => {
      response.result.current.revalidate();
    });

    await waitFor(async () => {
      await testSuccessState(customMock, response);
    });
  });
  it("should allow to revalidate hook by RegExp", async () => {
    const regexp = /(Maciej|Kacper)/;
    const responseOne = renderUseFetch(request.setCacheKey("Maciej"));
    const responseTwo = renderUseFetch(request.setCacheKey("Kacper"));

    await waitFor(async () => {
      await testSuccessState(mock, responseOne);
      await testSuccessState(mock, responseTwo);
    });
    const customMock = createRequestInterceptor(request, { fixture: { something: 123 } });

    act(() => {
      responseOne.result.current.revalidate(regexp);
    });

    await waitFor(async () => {
      await testSuccessState(customMock, responseOne);
      await testSuccessState(customMock, responseTwo);
    });
  });
  it("should allow to revalidate hook by keys array", async () => {
    const responseOne = renderUseFetch(request.setCacheKey("Maciej"));
    const responseTwo = renderUseFetch(request.setCacheKey("Kacper"));

    await waitFor(async () => {
      await testSuccessState(mock, responseOne);
      await testSuccessState(mock, responseTwo);
    });
    const customMock = createRequestInterceptor(request, { fixture: { something: 123 } });

    act(() => {
      responseOne.result.current.revalidate(["Maciej"]);
    });

    await waitFor(async () => {
      await testSuccessState(customMock, responseOne);
      await testSuccessState(mock, responseTwo);
    });
  });
  it("should allow to revalidate hook by key", async () => {
    const responseOne = renderUseFetch(request.setCacheKey("Maciej"));
    const responseTwo = renderUseFetch(request.setCacheKey("Kacper"));

    await waitFor(async () => {
      await testSuccessState(mock, responseOne);
      await testSuccessState(mock, responseTwo);
    });
    const customMock = createRequestInterceptor(request, { fixture: { something: 123 } });

    act(() => {
      responseOne.result.current.revalidate("Maciej");
    });

    await waitFor(async () => {
      await testSuccessState(customMock, responseOne);
      await testSuccessState(mock, responseTwo);
    });
  });
  it("should allow to revalidate hook by request", async () => {
    const responseOne = renderUseFetch(request.setQueryParams("?something=123"));
    const responseTwo = renderUseFetch(request.setQueryParams("?other=999"));

    await waitFor(async () => {
      await testSuccessState(mock, responseOne);
      await testSuccessState(mock, responseTwo);
    });
    const customMock = createRequestInterceptor(request, { fixture: { something: 123 } });

    act(() => {
      responseOne.result.current.revalidate(request.setQueryParams("?something=123"));
    });

    await waitFor(async () => {
      await testSuccessState(customMock, responseOne);
      await testSuccessState(mock, responseTwo);
    });
  });
});

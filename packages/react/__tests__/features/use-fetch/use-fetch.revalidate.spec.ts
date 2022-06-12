import { act, waitFor } from "@testing-library/react";
import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { testSuccessState } from "../../shared";
import { builder, createCommand, renderUseFetch } from "../../utils";

describe("useFetch [ Revalidate ]", () => {
  let command = createCommand();
  let mock = createRequestInterceptor(command);

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
    command = createCommand();
    builder.clear();
    mock = createRequestInterceptor(command);
  });

  it("should allow to prevent revalidation on mount", async () => {
    const customMock = { something: "123" };
    builder.cache.set(command, [customMock, null, 200], {
      retries: 0,
      timestamp: new Date(),
      isFailed: false,
      isCanceled: false,
      isOffline: false,
    });

    const response = renderUseFetch(command, { revalidateOnMount: false });

    await testSuccessState(customMock, response);
  });
  it("should allow to revalidate on mount", async () => {
    const customMock = { something: "123" };
    builder.cache.set(command, [customMock, null, 200], {
      retries: 0,
      timestamp: new Date(),
      isFailed: false,
      isCanceled: false,
      isOffline: false,
    });

    const response = renderUseFetch(command, { revalidateOnMount: true });

    await waitFor(async () => {
      await testSuccessState(mock, response);
    });
  });
  it("should allow to revalidate current hook", async () => {
    const response = renderUseFetch(command);

    await waitFor(async () => {
      await testSuccessState(mock, response);
    });
    const customMock = createRequestInterceptor(command, { fixture: { something: 123 } });

    act(() => {
      response.result.current.revalidate();
    });

    await waitFor(async () => {
      await testSuccessState(customMock, response);
    });
  });
  it("should allow to revalidate hook by RegExp", async () => {
    const regexp = /(Maciej|Kacper)/;
    const responseOne = renderUseFetch(command.setCacheKey("Maciej"));
    const responseTwo = renderUseFetch(command.setCacheKey("Kacper"));

    await waitFor(async () => {
      await testSuccessState(mock, responseOne);
      await testSuccessState(mock, responseTwo);
    });
    const customMock = createRequestInterceptor(command, { fixture: { something: 123 } });

    act(() => {
      responseOne.result.current.revalidate(regexp);
    });

    await waitFor(async () => {
      await testSuccessState(customMock, responseOne);
      await testSuccessState(customMock, responseTwo);
    });
  });
  it("should allow to revalidate hook by key", async () => {
    const responseOne = renderUseFetch(command.setCacheKey("Maciej"));
    const responseTwo = renderUseFetch(command.setCacheKey("Kacper"));

    await waitFor(async () => {
      await testSuccessState(mock, responseOne);
      await testSuccessState(mock, responseTwo);
    });
    const customMock = createRequestInterceptor(command, { fixture: { something: 123 } });

    act(() => {
      responseOne.result.current.revalidate("Maciej");
    });

    await waitFor(async () => {
      await testSuccessState(customMock, responseOne);
      await testSuccessState(mock, responseTwo);
    });
  });
  it("should allow to revalidate hook by command", async () => {
    const responseOne = renderUseFetch(command.setQueryParams("?something=123"));
    const responseTwo = renderUseFetch(command.setQueryParams("?other=999"));

    await waitFor(async () => {
      await testSuccessState(mock, responseOne);
      await testSuccessState(mock, responseTwo);
    });
    const customMock = createRequestInterceptor(command, { fixture: { something: 123 } });

    act(() => {
      responseOne.result.current.revalidate(command);
    });

    await waitFor(async () => {
      await testSuccessState(customMock, responseOne);
      await testSuccessState(customMock, responseTwo);
    });
  });
});

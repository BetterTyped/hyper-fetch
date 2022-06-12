import { act } from "@testing-library/react";

import { createCommand, renderUseFetch, createCacheData, waitForRender, builder } from "../../utils";
import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { testSuccessState, testErrorState, testInitialState, testCacheState, testBuilderIsolation } from "../../shared";

describe("useFetch [ Basic ]", () => {
  let command = createCommand();

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
  });

  describe("when hook is initialized", () => {
    it("should initialize in idle state", async () => {
      createRequestInterceptor(command);
      const response = renderUseFetch(command);

      testInitialState(response);
      await testBuilderIsolation(builder);
      await waitForRender();
    });
    it("should load cached data", async () => {
      const mock = createRequestInterceptor(command);
      await testBuilderIsolation(builder);
      const [cache] = await createCacheData(command, {
        data: [mock, null, 200],
        details: { retries: 2 },
      });
      const response = renderUseFetch(command);
      await waitForRender();
      await testCacheState(cache, response);
    });
    it("should not load stale cache data", async () => {
      const timestamp = new Date(+new Date() - 10);
      const mock = createRequestInterceptor(command, { delay: 20 });
      await testBuilderIsolation(builder);
      await createCacheData(command, { data: [mock, null, 200], details: { timestamp, retries: 3 } });

      const response = renderUseFetch(command.setCacheTime(10));

      await waitForRender();
      await testCacheState([null, null, null], response);
    });
    it("should make only one request", async () => {});
  });
  describe("when hook get success response", () => {
    it("should set state with success data", async () => {
      await testBuilderIsolation(builder);
      const mock = createRequestInterceptor(command);
      const response = renderUseFetch(command);

      await waitForRender();
      await testSuccessState(mock, response);
    });
    it("should clear previous error state once success response is returned", async () => {
      await testBuilderIsolation(builder);
      const errorMock = createRequestInterceptor(command, { status: 400 });
      const response = renderUseFetch(command);

      await waitForRender();
      await testErrorState(errorMock, response);
      const mock = createRequestInterceptor(command);

      act(() => {
        response.result.current.revalidate();
      });

      await testSuccessState(mock, response);
    });
  });
  describe("when hook get error response", () => {
    it("should set state with error data", async () => {
      await testBuilderIsolation(builder);
      const mock = createRequestInterceptor(command, { status: 400 });
      const response = renderUseFetch(command);

      await waitForRender();
      await testErrorState(mock, response);
    });
    it("should keep previous success state once error response is returned", async () => {
      await testBuilderIsolation(builder);
      const mock = createRequestInterceptor(command);
      const response = renderUseFetch(command);

      await waitForRender();
      await testSuccessState(mock, response);

      const errorMock = createRequestInterceptor(command, { status: 400 });

      act(() => {
        response.result.current.revalidate();
      });

      await testErrorState(errorMock, response, mock);
    });
  });
  describe("when dependencies change", () => {
    it("should fetch when dependencies change", async () => {
      // Todo
    });
  });
});

import { act } from "@testing-library/react";
import { ClientResponseType } from "@hyper-fetch/core";

import { createCommand, renderUseFetch, createCacheData, builder, sleep } from "../../utils";
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
    it("should initialize in loading state", async () => {
      await testBuilderIsolation(builder);
      createRequestInterceptor(command);
      const view = renderUseFetch(command);

      testInitialState(view);
    });
    it("should load cached data", async () => {
      await testBuilderIsolation(builder);
      const mock = createRequestInterceptor(command);
      const [cache] = createCacheData(command, {
        data: [mock, null, 200],
        details: { retries: 2 },
      });
      const view = renderUseFetch(command);
      await testCacheState(cache, view);
    });
    it("should not load stale cache data", async () => {
      await testBuilderIsolation(builder);
      const timestamp = +new Date() - 11;
      const mock = createRequestInterceptor(command, { delay: 20 });
      createCacheData(command, { data: [mock, null, 200], details: { timestamp, retries: 3 } });

      const view = renderUseFetch(command.setCacheTime(10));

      await testCacheState([null, null, null], view);
    });
    it("should allow to use initial data", async () => {
      const initialData: ClientResponseType<unknown, Error> = [{ test: [1, 2, 3] }, null, 200];
      const view = renderUseFetch(command, { disabled: true, initialData });

      await testSuccessState(initialData[0], view);
    });
    it("should prefer cache data over initial data", async () => {
      // Todo
    });
    it("should make only one request", async () => {
      const spy = jest.spyOn(builder, "client");
      await testBuilderIsolation(builder);
      const mock = createRequestInterceptor(command);
      const view = renderUseFetch(command);

      await testSuccessState(mock, view);
      await sleep(50);
      expect(spy).toBeCalledTimes(1);
    });
  });
  describe("when hook get success response", () => {
    it("should set state with success data", async () => {
      await testBuilderIsolation(builder);
      const mock = createRequestInterceptor(command);
      const view = renderUseFetch(command);

      await testSuccessState(mock, view);
    });
    it("should clear previous error state once success response is returned", async () => {
      await testBuilderIsolation(builder);
      const errorMock = createRequestInterceptor(command, { status: 400 });
      const view = renderUseFetch(command);

      await testErrorState(errorMock, view);
      const mock = createRequestInterceptor(command);

      act(() => {
        view.result.current.revalidate();
      });

      await testSuccessState(mock, view);
    });
    it("should change loading to false on success", async () => {
      // Todo
    });
  });
  describe("when hook get error response", () => {
    it("should set state with error data", async () => {
      await testBuilderIsolation(builder);
      const mock = createRequestInterceptor(command, { status: 400 });
      const view = renderUseFetch(command);

      await testErrorState(mock, view);
    });
    it("should keep previous success state once error response is returned", async () => {
      await testBuilderIsolation(builder);
      const mock = createRequestInterceptor(command);
      const view = renderUseFetch(command);

      await testSuccessState(mock, view);

      const errorMock = createRequestInterceptor(command, { status: 400 });

      act(() => {
        view.result.current.revalidate();
      });

      await testErrorState(errorMock, view, mock);
    });
    it("should change loading to false on error", async () => {
      // Todo
    });
  });
  describe("when dependencies change", () => {
    // Solves Issue #22
    it("should fetch data when disabled prop changes", async () => {
      const spy = jest.fn();
      await testBuilderIsolation(builder);
      const mock = createRequestInterceptor(command);
      const view = renderUseFetch(command, { disabled: true });

      act(() => {
        view.result.current.onRequestStart(spy);
      });

      await sleep(20);
      expect(spy).toBeCalledTimes(0);

      view.rerender({ disabled: false });

      await testSuccessState(mock, view);
      expect(spy).toBeCalledTimes(1);
    });
    it("should fetch when dependencies change", async () => {
      // Todo
    });
  });
});

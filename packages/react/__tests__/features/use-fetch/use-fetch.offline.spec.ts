import { waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { testErrorState, testSuccessState } from "../../shared";
import { builder, createCommand, renderUseFetch, waitForRender } from "../../utils";

describe("useFetch [ Offline ]", () => {
  let command = createCommand({ offline: true });

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
    command = createCommand({ offline: true });
    builder.clear();
  });

  describe("when application is offline", () => {
    it("should not revalidate on offline", async () => {
      const mock = createRequestInterceptor(command);
      const response = renderUseFetch(command);

      await testSuccessState(mock, response);

      const spy = jest.spyOn(builder, "client");

      act(() => {
        builder.appManager.setOnline(false);
        response.result.current.revalidate();
      });

      expect(spy).toBeCalledTimes(0);
    });
    it("should finish request when coming back online", async () => {
      builder.appManager.setOnline(false);

      const mock = createRequestInterceptor(command);
      const response = renderUseFetch(command);

      act(() => {
        builder.appManager.setOnline(true);
      });
      await testSuccessState(mock, response);
    });
    it("should refetch when coming back online", async () => {
      const spy = jest.fn();
      const mock = createRequestInterceptor(command);
      const response = renderUseFetch(command, { refreshOnReconnect: true });
      await testSuccessState(mock, response);

      act(() => {
        response.result.current.onRequestStart(spy);
        builder.appManager.setOnline(false);
        builder.appManager.setOnline(true);
      });
      await waitFor(() => {
        expect(spy).toBeCalledTimes(1);
      });
    });
  });
  describe("when command offline attribute is set to true", () => {
    it("should not emit offline error until request is finished", async () => {
      const mock = createRequestInterceptor(command);
      const response = renderUseFetch(command);
      await waitForRender();
      act(() => {
        builder.appManager.setOnline(false);
      });
      await waitForRender();
      act(() => {
        builder.appManager.setOnline(true);
      });
      await testSuccessState(mock, response);
    });
  });
  describe("when command offline attribute is set to false", () => {
    it("should emit offline error until request is finished", async () => {
      const mock = createRequestInterceptor(command, { status: 400 });
      const response = renderUseFetch(command.setOffline(false));
      await waitForRender();
      act(() => {
        builder.appManager.setOnline(false);
      });
      await waitForRender();
      act(() => {
        builder.appManager.setOnline(true);
      });
      await testErrorState(mock, response);
    });
  });
});

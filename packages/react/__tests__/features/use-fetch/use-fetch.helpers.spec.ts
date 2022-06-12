import { act, waitFor } from "@testing-library/react";
import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { testErrorState, testSuccessState } from "../../shared";
import { builder, createCommand, renderUseFetch, waitForRender } from "../../utils";

describe("useFetch [ Helpers ]", () => {
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

  describe("given hook is mounted", () => {
    describe("when processing request", () => {
      it("should trigger onRequestStart helper", async () => {
        const spy = jest.fn();
        const mock = createRequestInterceptor(command);
        const response = renderUseFetch(command);

        act(() => {
          response.result.current.onRequestStart(spy);
        });

        await waitForRender();
        await testSuccessState(mock, response);
        expect(spy).toBeCalledTimes(1);
      });
      it("should trigger onResponseStart helper", async () => {
        const spy = jest.fn();
        const mock = createRequestInterceptor(command);
        const response = renderUseFetch(command);

        act(() => {
          response.result.current.onResponseStart(spy);
        });

        await waitForRender();
        await testSuccessState(mock, response);
        expect(spy).toBeCalledTimes(1);
      });
      it("should trigger onDownloadProgress helper", async () => {
        const spy = jest.fn();
        const mock = createRequestInterceptor(command);
        const response = renderUseFetch(command);

        act(() => {
          response.result.current.onDownloadProgress(spy);
        });

        await waitForRender();
        await testSuccessState(mock, response);
        expect(spy).toBeCalledTimes(2);
      });
      it("should trigger onUploadProgress helper", async () => {
        const spy = jest.fn();
        const mock = createRequestInterceptor(command);
        const response = renderUseFetch(command);

        act(() => {
          response.result.current.onUploadProgress(spy);
        });

        await waitForRender();
        await testSuccessState(mock, response);
        expect(spy).toBeCalledTimes(2);
      });
    });
    describe("when getting the response", () => {
      it("should trigger onSuccess helper", async () => {
        const spy = jest.fn();
        const unusedSpy = jest.fn();
        const mock = createRequestInterceptor(command);
        const response = renderUseFetch(command);

        act(() => {
          response.result.current.onSuccess(spy);
          response.result.current.onError(unusedSpy);
        });

        await waitForRender();
        await testSuccessState(mock, response);
        expect(spy).toBeCalledTimes(1);
        expect(unusedSpy).toBeCalledTimes(0);
      });
      it("should trigger onError helper", async () => {
        const spy = jest.fn();
        const unusedSpy = jest.fn();
        const mock = createRequestInterceptor(command, { status: 400 });
        const response = renderUseFetch(command);

        act(() => {
          response.result.current.onError(spy);
          response.result.current.onSuccess(unusedSpy);
        });

        await waitForRender();
        await testErrorState(mock, response);
        expect(spy).toBeCalledTimes(1);
        expect(unusedSpy).toBeCalledTimes(0);
      });
      it("should trigger onFinished helper on success", async () => {
        const spy = jest.fn();
        const mock = createRequestInterceptor(command);
        const response = renderUseFetch(command);

        act(() => {
          response.result.current.onFinished(spy);
        });

        await waitForRender();
        await testSuccessState(mock, response);
        expect(spy).toBeCalledTimes(1);
      });
      it("should trigger onFinished helper on error", async () => {
        const spy = jest.fn();
        const mock = createRequestInterceptor(command, { status: 400 });
        const response = renderUseFetch(command);

        act(() => {
          response.result.current.onFinished(spy);
        });

        await waitForRender();
        await testErrorState(mock, response);
        expect(spy).toBeCalledTimes(1);
      });
    });
    describe("when getting internal error", () => {
      it("should trigger onOfflineError helper", async () => {
        const spy = jest.fn();
        createRequestInterceptor(command, { status: 400 });
        const response = renderUseFetch(command.setOffline(true));

        await waitForRender();

        act(() => {
          response.result.current.onOfflineError(spy);
          builder.appManager.setOnline(false);
        });

        await waitFor(() => {
          expect(spy).toBeCalledTimes(1);
        });
      });
    });
  });
});

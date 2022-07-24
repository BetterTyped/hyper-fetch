import { act, waitFor } from "@testing-library/react";

import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { testErrorState, testSuccessState } from "../../shared";
import { builder, createCommand, renderUseSubmit } from "../../utils";

describe("useSubmit [ Methods ]", () => {
  let command = createCommand({ method: "POST" });

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
    command = createCommand({ method: "POST" });
    builder.clear();
  });

  describe("given hook is mounted", () => {
    describe("when processing request", () => {
      it("should trigger onRequestStart helper", async () => {
        const spy = jest.fn();
        const mock = createRequestInterceptor(command);
        const response = renderUseSubmit(command);

        act(() => {
          response.result.current.onSubmitRequestStart(spy);
          response.result.current.submit();
        });

        await testSuccessState(mock, response);
        expect(spy).toBeCalledTimes(1);
      });
      it("should trigger onResponseStart helper", async () => {
        const spy = jest.fn();
        const mock = createRequestInterceptor(command);
        const response = renderUseSubmit(command);

        act(() => {
          response.result.current.onSubmitResponseStart(spy);
          response.result.current.submit();
        });

        await testSuccessState(mock, response);
        expect(spy).toBeCalledTimes(1);
      });
      it("should trigger onDownloadProgress helper", async () => {
        const spy = jest.fn();
        const mock = createRequestInterceptor(command);
        const response = renderUseSubmit(command);

        act(() => {
          response.result.current.onSubmitDownloadProgress(spy);
          response.result.current.submit();
        });

        await testSuccessState(mock, response);
        expect(spy).toBeCalledTimes(3);
      });
      it("should trigger onUploadProgress helper", async () => {
        const spy = jest.fn();
        const mock = createRequestInterceptor(command);
        const response = renderUseSubmit(command);

        act(() => {
          response.result.current.onSubmitUploadProgress(spy);
          response.result.current.submit();
        });

        await testSuccessState(mock, response);
        expect(spy).toBeCalledTimes(2);
      });
      it("should allow to trigger all event methods on dynamic keys change", async () => {
        const spy1 = jest.fn();
        const spy2 = jest.fn();
        const spy3 = jest.fn();
        const spy4 = jest.fn();
        const spy5 = jest.fn();
        const spy6 = jest.fn();
        const mock = createRequestInterceptor(command);
        const response = renderUseSubmit(command);

        act(() => {
          response.result.current.onSubmitRequestStart(spy1);
          response.result.current.onSubmitResponseStart(spy2);
          response.result.current.onSubmitDownloadProgress(spy3);
          response.result.current.onSubmitUploadProgress(spy4);
          response.result.current.onSubmitSuccess(spy5);
          response.result.current.onSubmitFinished(spy6);
          response.result.current.submit();
          response.result.current.submit({ queryParams: "something=old" });
          response.result.current.submit({ queryParams: "something=new" });
        });

        await testSuccessState(mock, response);
        expect(spy1).toBeCalledTimes(3);
        expect(spy2).toBeCalledTimes(3);
        expect(spy3).toBeCalledTimes(9);
        expect(spy4).toBeCalledTimes(6);
        expect(spy5).toBeCalledTimes(3);
        expect(spy6).toBeCalledTimes(3);
      });
    });
    describe("when getting the response", () => {
      it("should trigger onSuccess helper", async () => {
        const spy = jest.fn();
        const unusedSpy = jest.fn();
        const mock = createRequestInterceptor(command);
        const response = renderUseSubmit(command);

        act(() => {
          response.result.current.onSubmitSuccess(spy);
          response.result.current.onSubmitError(unusedSpy);
          response.result.current.submit();
        });

        await testSuccessState(mock, response);
        expect(spy).toBeCalledTimes(1);
        expect(unusedSpy).toBeCalledTimes(0);
      });
      it("should trigger onError helper", async () => {
        const spy = jest.fn();
        const unusedSpy = jest.fn();
        const mock = createRequestInterceptor(command, { status: 400 });
        const response = renderUseSubmit(command);

        act(() => {
          response.result.current.onSubmitError(spy);
          response.result.current.onSubmitSuccess(unusedSpy);
          response.result.current.submit();
        });

        await testErrorState(mock, response);
        expect(spy).toBeCalledTimes(1);
        expect(unusedSpy).toBeCalledTimes(0);
      });
      it("should trigger onFinished helper on success", async () => {
        const spy = jest.fn();
        const mock = createRequestInterceptor(command);
        const response = renderUseSubmit(command);

        act(() => {
          response.result.current.onSubmitFinished(spy);
          response.result.current.submit();
        });

        await testSuccessState(mock, response);
        expect(spy).toBeCalledTimes(1);
      });
      it("should trigger onFinished helper on error", async () => {
        const spy = jest.fn();
        const mock = createRequestInterceptor(command, { status: 400 });
        const response = renderUseSubmit(command);

        act(() => {
          response.result.current.onSubmitFinished(spy);
          response.result.current.submit();
        });

        await testErrorState(mock, response);
        expect(spy).toBeCalledTimes(1);
      });
    });
    describe("when getting internal error", () => {
      it("should trigger onOfflineError helper", async () => {
        const spy = jest.fn();
        createRequestInterceptor(command, { status: 400 });
        const response = renderUseSubmit(command.setOffline(true));

        act(() => {
          response.result.current.onSubmitOfflineError(spy);
          response.result.current.submit();
          builder.appManager.setOnline(false);
        });

        await waitFor(() => {
          expect(spy).toBeCalledTimes(1);
        });
      });

      it("should trigger methods on retry", async () => {
        const spy1 = jest.fn();
        const spy2 = jest.fn();
        const spy3 = jest.fn();
        const spy4 = jest.fn();
        const spy5 = jest.fn();
        const spy6 = jest.fn();
        const spy7 = jest.fn();
        const spy8 = jest.fn();

        const errorMock = createRequestInterceptor(command, { status: 400 });
        const response = renderUseSubmit(command.setRetry(1).setRetryTime(100));

        act(() => {
          response.result.current.onSubmitRequestStart(spy1);
          response.result.current.onSubmitResponseStart(spy2);
          response.result.current.onSubmitDownloadProgress(spy3);
          response.result.current.onSubmitUploadProgress(spy4);
          response.result.current.onSubmitSuccess(spy5);
          response.result.current.onSubmitError(spy6);
          response.result.current.onSubmitFinished(spy7);
          response.result.current.onSubmitOfflineError(spy8);
          response.result.current.submit();
        });

        await testErrorState(errorMock, response);
        const successMock = createRequestInterceptor(command);
        await testSuccessState(successMock, response);

        expect(spy1).toBeCalledTimes(2);
        expect(spy2).toBeCalledTimes(2);
        expect(spy3).toBeCalledTimes(6);
        expect(spy4).toBeCalledTimes(4);
        expect(spy5).toBeCalledTimes(1);
        expect(spy6).toBeCalledTimes(1);
        expect(spy7).toBeCalledTimes(2);
        expect(spy8).toBeCalledTimes(0);
      });
      it("should trigger methods on coming back online", async () => {
        const spy1 = jest.fn();
        const spy2 = jest.fn();
        const spy3 = jest.fn();
        const spy4 = jest.fn();
        const spy5 = jest.fn();
        const spy6 = jest.fn();
        const spy7 = jest.fn();
        const spy8 = jest.fn();

        const errorMock = createRequestInterceptor(command, { status: 400 });
        const response = renderUseSubmit(command);

        act(() => {
          response.result.current.onSubmitRequestStart(spy1);
          response.result.current.onSubmitResponseStart(spy2);
          response.result.current.onSubmitDownloadProgress(spy3);
          response.result.current.onSubmitUploadProgress(spy4);
          response.result.current.onSubmitSuccess(spy5);
          response.result.current.onSubmitError(spy6);
          response.result.current.onSubmitFinished(spy7);
          response.result.current.onSubmitOfflineError(spy8);

          response.result.current.submit();
          builder.appManager.setOnline(false);
        });

        await testErrorState(errorMock, response);
        const successMock = createRequestInterceptor(command);

        act(() => {
          builder.appManager.setOnline(true);
        });

        await testSuccessState(successMock, response);
        expect(spy1).toBeCalledTimes(2);
        expect(spy2).toBeCalledTimes(2);
        expect(spy3).toBeCalledTimes(6);
        expect(spy4).toBeCalledTimes(4);
        expect(spy5).toBeCalledTimes(1);
        expect(spy6).toBeCalledTimes(0);
        expect(spy7).toBeCalledTimes(2);
        expect(spy8).toBeCalledTimes(1);
      });
    });
  });
});

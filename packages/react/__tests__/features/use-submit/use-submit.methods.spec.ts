import { act, waitFor } from "@testing-library/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { testErrorState, testSuccessState } from "../../shared";
import { client, createRequest, renderUseSubmit } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useSubmit [ Methods ]", () => {
  let request = createRequest<{
    queryParams?: string;
  }>({ method: "POST" });

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
    request = createRequest<{ queryParams?: string }>({ method: "POST" });
    client.clear();
  });

  describe("given hook is mounted", () => {
    describe("when processing request", () => {
      it("should trigger onRequestStart helper", async () => {
        const spy = jest.fn();
        const mock = mockRequest(request);
        const response = renderUseSubmit(request);

        act(() => {
          response.result.current.onSubmitRequestStart(spy);
          response.result.current.submit();
        });

        await testSuccessState(mock, response);
        expect(spy).toHaveBeenCalledTimes(1);
      });
      it("should trigger onResponseStart helper", async () => {
        const spy = jest.fn();
        const mock = mockRequest(request);
        const response = renderUseSubmit(request);

        act(() => {
          response.result.current.onSubmitResponseStart(spy);
          response.result.current.submit();
        });

        await testSuccessState(mock, response);
        expect(spy).toHaveBeenCalledTimes(1);
      });
      it("should trigger onDownloadProgress helper", async () => {
        const spy = jest.fn();
        const mock = mockRequest(request);
        const response = renderUseSubmit(request);

        act(() => {
          response.result.current.onSubmitDownloadProgress(spy);
          response.result.current.submit();
        });

        await testSuccessState(mock, response);
        expect(spy).toHaveBeenCalledTimes(3);
      });
      it("should trigger onUploadProgress helper", async () => {
        const spy = jest.fn();
        const mock = mockRequest(request);
        const response = renderUseSubmit(request);

        act(() => {
          response.result.current.onSubmitUploadProgress(spy);
          response.result.current.submit();
        });

        await testSuccessState(mock, response);
        expect(spy).toHaveBeenCalledTimes(3);
      });
      it("should allow to trigger all event methods on dynamic keys change", async () => {
        const spy1 = jest.fn();
        const spy2 = jest.fn();
        const spy3 = jest.fn();
        const spy4 = jest.fn();
        const spy5 = jest.fn();
        const spy6 = jest.fn();
        const mock = mockRequest(request);
        const response = renderUseSubmit(request);

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
        expect(spy1).toHaveBeenCalledTimes(3);
        expect(spy2).toHaveBeenCalledTimes(3);
        expect(spy3).toHaveBeenCalledTimes(9);
        expect(spy4).toHaveBeenCalledTimes(9);
        expect(spy5).toHaveBeenCalledTimes(3);
        expect(spy6).toHaveBeenCalledTimes(3);
      });
    });
    describe("when getting the response", () => {
      it("should trigger onSuccess helper", async () => {
        const spy = jest.fn();
        const unusedSpy = jest.fn();
        const mock = mockRequest(request);
        const response = renderUseSubmit(request);

        act(() => {
          response.result.current.onSubmitSuccess(spy);
          response.result.current.onSubmitError(unusedSpy);
          response.result.current.submit();
        });

        await testSuccessState(mock, response);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(unusedSpy).toHaveBeenCalledTimes(0);
      });
      it("should trigger onError helper", async () => {
        const spy = jest.fn();
        const unusedSpy = jest.fn();
        const mock = mockRequest(request, { status: 400 });
        const response = renderUseSubmit(request);

        act(() => {
          response.result.current.onSubmitError(spy);
          response.result.current.onSubmitSuccess(unusedSpy);
          response.result.current.submit();
        });

        await testErrorState(mock, response);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(unusedSpy).toHaveBeenCalledTimes(0);
      });
      it("should trigger onFinished helper on success", async () => {
        const spy = jest.fn();
        const mock = mockRequest(request);
        const response = renderUseSubmit(request);

        act(() => {
          response.result.current.onSubmitFinished(spy);
          response.result.current.submit();
        });

        await testSuccessState(mock, response);
        expect(spy).toHaveBeenCalledTimes(1);
      });
      it("should trigger onFinished helper on error", async () => {
        const spy = jest.fn();
        const mock = mockRequest(request, { status: 400 });
        const response = renderUseSubmit(request);

        act(() => {
          response.result.current.onSubmitFinished(spy);
          response.result.current.submit();
        });

        await testErrorState(mock, response);
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
    describe("when getting internal error", () => {
      it("should trigger onOfflineError helper", async () => {
        const spy = jest.fn();
        mockRequest(request, { status: 400 });
        const response = renderUseSubmit(request.setOffline(true));

        act(() => {
          response.result.current.onSubmitOfflineError(spy);
          response.result.current.submit();
          client.appManager.setOnline(false);
        });

        await waitFor(() => {
          expect(spy).toHaveBeenCalledTimes(1);
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

        const errorMock = mockRequest(request, { status: 400 });
        const response = renderUseSubmit(request.setRetry(1).setRetryTime(100));

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
        const successMock = mockRequest(request);
        await testSuccessState(successMock, response);

        expect(spy1).toHaveBeenCalledTimes(2);
        expect(spy2).toHaveBeenCalledTimes(2);
        expect(spy3).toHaveBeenCalledTimes(6);
        expect(spy4).toHaveBeenCalledTimes(6);
        expect(spy5).toHaveBeenCalledTimes(1);
        expect(spy6).toHaveBeenCalledTimes(1);
        expect(spy7).toHaveBeenCalledTimes(2);
        expect(spy8).toHaveBeenCalledTimes(0);
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

        const errorMock = mockRequest(request, { status: 400 });
        const response = renderUseSubmit(request);

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
          client.appManager.setOnline(false);
        });

        await testErrorState(errorMock, response);
        const successMock = mockRequest(request);

        act(() => {
          client.appManager.setOnline(true);
        });

        await testSuccessState(successMock, response);
        expect(spy1).toHaveBeenCalledTimes(2);
        expect(spy2).toHaveBeenCalledTimes(2);
        expect(spy3).toHaveBeenCalledTimes(6);
        expect(spy4).toHaveBeenCalledTimes(6);
        expect(spy5).toHaveBeenCalledTimes(1);
        expect(spy6).toHaveBeenCalledTimes(0);
        expect(spy7).toHaveBeenCalledTimes(2);
        expect(spy8).toHaveBeenCalledTimes(1);
      });
    });
  });
});

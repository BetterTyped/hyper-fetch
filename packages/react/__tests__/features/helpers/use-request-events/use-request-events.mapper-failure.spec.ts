import type { OptimisticRollbackArgs } from "@hyper-fetch/core";
import { Client } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useFetch } from "hooks/use-fetch";
import { useSubmit } from "hooks/use-submit";
import { StrictMode } from "react";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

const MAPPER_ERROR = new Error("Mapper failed");

// Failing mappers keep the response type, otherwise the mapped request would be typed with `never`
type FailingMapper = <Response>(response: Response) => Response | Promise<Response>;

const rejectingMapper: FailingMapper = async () => {
  throw MAPPER_ERROR;
};

const throwingMapper: FailingMapper = () => {
  throw MAPPER_ERROR;
};

const failures = [
  { name: "rejects", mapper: rejectingMapper },
  { name: "throws synchronously", mapper: throwingMapper },
];

const createSetup = () => {
  const client = new Client({ url: "shared-base-url" });
  const logError = vi.spyOn(client.logger, "error");
  const rollback = vi.fn((_args: OptimisticRollbackArgs<any>) => undefined);

  const fetchRequest = client.createRequest<{ response: { ok: boolean } }>()({ endpoint: "/fetch" });
  const submitRequest = client
    .createRequest<{ response: { ok: boolean } }>()({ endpoint: "/submit", method: "POST" })
    .setOptimistic(() => ({ rollback }));

  return { client, logError, rollback, fetchRequest, submitRequest };
};

describe("useRequestEvents [ Response mapper failure ]", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe.each(failures)("when the mapper $name", ({ mapper }) => {
    it("should call error callbacks of useSubmit with the mapper error", async () => {
      const { submitRequest } = createSetup();
      const request = submitRequest.setResponseMapper(mapper);
      mockRequest(request, { data: { ok: true } });
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onFinished = vi.fn();

      const { result } = renderHook(() => useSubmit(request));
      act(() => {
        result.current.onSubmitSuccess(onSuccess);
        result.current.onSubmitError(onError);
        result.current.onSubmitFinished(onFinished);
      });

      let response: Awaited<ReturnType<typeof result.current.submit>> | undefined;
      await act(async () => {
        response = await result.current.submit();
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledTimes(1);
      });
      expect(onError.mock.calls[0][0].response.error).toBe(MAPPER_ERROR);
      expect(onError.mock.calls[0][0].response.success).toBe(false);
      expect(onFinished).toHaveBeenCalledTimes(1);
      expect(onSuccess).not.toHaveBeenCalled();
      expect(response?.error).toBe(MAPPER_ERROR);
    });

    it("should roll back useSubmit optimistic change once", async () => {
      const { submitRequest, rollback } = createSetup();
      const request = submitRequest.setResponseMapper(mapper);
      mockRequest(request, { data: { ok: true } });

      const { result } = renderHook(() => useSubmit(request));
      await act(async () => {
        await result.current.submit();
      });

      expect(rollback).toHaveBeenCalledTimes(1);
      expect(rollback.mock.calls[0][0]).toMatchObject({ reason: "error" });
      expect(rollback.mock.calls[0][0].response?.error).toBe(MAPPER_ERROR);
    });

    it("should roll back and call error callback once in StrictMode", async () => {
      const { submitRequest, rollback } = createSetup();
      const request = submitRequest.setResponseMapper(mapper);
      mockRequest(request, { data: { ok: true } });
      const onError = vi.fn();

      const { result } = renderHook(() => useSubmit(request), { wrapper: StrictMode });
      act(() => {
        result.current.onSubmitError(onError);
      });
      await act(async () => {
        await result.current.submit();
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledTimes(1);
      });
      expect(rollback).toHaveBeenCalledTimes(1);
    });

    it("should roll back without calling callbacks when unmounted while pending", async () => {
      const { client, submitRequest, rollback } = createSetup();
      const request = submitRequest.setResponseMapper(mapper);
      mockRequest(request, { data: { ok: true }, delay: 30 });
      const onError = vi.fn();

      const { result, unmount } = renderHook(() => useSubmit(request));
      act(() => {
        result.current.onSubmitError(onError);
      });
      // Hook listeners are attached right before the request starts
      const unmountOnStart = client.requestManager.events.onRequestStart(() => {
        unmountOnStart();
        unmount();
      });
      let pending: ReturnType<typeof result.current.submit> | undefined;
      act(() => {
        pending = result.current.submit();
      });
      const response = await pending;

      expect(response?.error).toBe(MAPPER_ERROR);
      expect(rollback).toHaveBeenCalledTimes(1);
      expect(onError).not.toHaveBeenCalled();
    });

    it("should call error callbacks of useFetch with the mapper error", async () => {
      const { fetchRequest, logError } = createSetup();
      const request = fetchRequest.setResponseMapper(mapper);
      mockRequest(request, { data: { ok: true } });
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onFinished = vi.fn();

      const { result } = renderHook(() => useFetch(request));
      act(() => {
        result.current.onSuccess(onSuccess);
        result.current.onError(onError);
        result.current.onFinished(onFinished);
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledTimes(1);
      });
      expect(onError.mock.calls[0][0].response.error).toBe(MAPPER_ERROR);
      expect(onFinished).toHaveBeenCalledTimes(1);
      expect(onSuccess).not.toHaveBeenCalled();
      expect(logError).toHaveBeenCalledWith(expect.objectContaining({ title: "Response mapper failed" }));
    });

    it("should expose the mapper error in useFetch state and stop loading", async () => {
      const { fetchRequest } = createSetup();
      const request = fetchRequest.setResponseMapper(mapper);
      mockRequest(request, { data: { ok: true } });

      const { result } = renderHook(() => useFetch(request));

      await waitFor(() => {
        expect(result.current.error).toBe(MAPPER_ERROR);
      });
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.data).toBeNull();
    });

    it("should not break useFetch mounted with cached data", async () => {
      const { client, fetchRequest } = createSetup();
      const request = fetchRequest.setResponseMapper(mapper);
      mockRequest(request, { data: { ok: true } });
      client.cache.set(request, {
        data: { ok: true },
        error: null,
        status: 200,
        success: true,
        extra: client.adapter.defaultExtra,
        retries: 0,
        isCanceled: false,
        isOffline: false,
        willRetry: false,
        addedTimestamp: Date.now(),
        triggerTimestamp: Date.now(),
        requestTimestamp: Date.now(),
        responseTimestamp: Date.now(),
      });

      const { result } = renderHook(() => useFetch(request));

      await waitFor(() => {
        expect(result.current.error).toBe(MAPPER_ERROR);
      });
      expect(result.current.data).toBeNull();
    });
  });
});

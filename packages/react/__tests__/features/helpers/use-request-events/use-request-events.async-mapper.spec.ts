import type { OptimisticRollbackArgs, RequestInstance } from "@hyper-fetch/core";
import { Client } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useFetch } from "hooks/use-fetch";
import { useSubmit } from "hooks/use-submit";
import { StrictMode } from "react";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

type Data = { ok: boolean; mapped?: boolean };

/**
 * Async response mapper which resolves only once the test releases it
 */
const createGatedMapper = () => {
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const calls = vi.fn();

  // Mapping keeps the response type, so the request and its mocks stay typed with `Data`
  const mapper = async <Response extends { data: Data | null }>(response: Response): Promise<Response> => {
    calls();
    await gate;
    const data: Data | null = response.data ? { ...response.data, mapped: true } : null;
    return { ...response, data };
  };

  return { mapper, calls, release };
};

/**
 * The hook delivers callbacks in a promise continuation of the mapper - after a macrotask all of them have run
 */
const flushPromises = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

const createSetup = () => {
  const client = new Client({ url: "shared-base-url" });
  const list = client.createRequest<{ response: string[] }>()({ endpoint: "/list" });
  const rollback = vi.fn((_args: OptimisticRollbackArgs<RequestInstance>) => undefined);
  const invalidate = vi.spyOn(client.cache, "invalidate");
  const gated = createGatedMapper();

  const fetchRequest = client
    .createRequest<{ response: Data }>()({ endpoint: "/fetch" })
    .setResponseMapper(gated.mapper);
  const submitRequest = client
    .createRequest<{ response: Data }>()({ endpoint: "/submit", method: "POST" })
    .setOptimistic(() => ({ rollback, invalidate: [list] }))
    .setResponseMapper(gated.mapper);

  return { client, list, rollback, invalidate, fetchRequest, submitRequest, ...gated };
};

const modes = [
  { mode: "default", wrapper: undefined },
  { mode: "StrictMode", wrapper: StrictMode },
];

describe("useRequestEvents [ Async response mapper ]", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe.each(modes)("when rendered in $mode", ({ wrapper }) => {
    const renderSubmit = (request: ReturnType<typeof createSetup>["submitRequest"]) => {
      const callbacks = { onSuccess: vi.fn(), onError: vi.fn(), onFinished: vi.fn() };
      const view = renderHook(() => useSubmit(request), { wrapper });

      act(() => {
        view.result.current.onSubmitSuccess(callbacks.onSuccess);
        view.result.current.onSubmitError(callbacks.onError);
        view.result.current.onSubmitFinished(callbacks.onFinished);
      });

      return { ...view, callbacks };
    };

    const renderFetch = (request: ReturnType<typeof createSetup>["fetchRequest"]) => {
      const callbacks = { onSuccess: vi.fn(), onError: vi.fn(), onFinished: vi.fn() };
      const view = renderHook(() => useFetch(request), { wrapper });

      act(() => {
        view.result.current.onSuccess(callbacks.onSuccess);
        view.result.current.onError(callbacks.onError);
        view.result.current.onFinished(callbacks.onFinished);
      });

      return { ...view, callbacks };
    };

    describe("when useSubmit unmounts while the mapper is pending", () => {
      it("should fire no callback and invalidate once after success", async () => {
        const setup = createSetup();
        mockRequest(setup.submitRequest, { data: { ok: true } });
        const { result, unmount, callbacks } = renderSubmit(setup.submitRequest);
        let pending: ReturnType<typeof result.current.submit> | undefined;

        act(() => {
          pending = result.current.submit();
        });
        await waitFor(() => {
          expect(setup.calls).toHaveBeenCalled();
        });
        unmount();
        setup.release();
        const response = await pending;
        await flushPromises();

        expect(response?.data).toStrictEqual({ ok: true, mapped: true });
        expect(callbacks.onSuccess).not.toHaveBeenCalled();
        expect(callbacks.onError).not.toHaveBeenCalled();
        expect(callbacks.onFinished).not.toHaveBeenCalled();
        expect(setup.invalidate).toHaveBeenCalledTimes(1);
        expect(setup.invalidate).toHaveBeenCalledWith(setup.list);
        expect(setup.rollback).not.toHaveBeenCalled();
      });

      it("should fire no callback and roll back once after error", async () => {
        const setup = createSetup();
        mockRequest(setup.submitRequest, { status: 400 });
        const { result, unmount, callbacks } = renderSubmit(setup.submitRequest);
        let pending: ReturnType<typeof result.current.submit> | undefined;

        act(() => {
          pending = result.current.submit();
        });
        await waitFor(() => {
          expect(setup.calls).toHaveBeenCalled();
        });
        unmount();
        setup.release();
        const response = await pending;
        await flushPromises();

        expect(response?.status).toBe(400);
        expect(callbacks.onSuccess).not.toHaveBeenCalled();
        expect(callbacks.onError).not.toHaveBeenCalled();
        expect(callbacks.onFinished).not.toHaveBeenCalled();
        expect(setup.rollback).toHaveBeenCalledTimes(1);
        expect(setup.rollback.mock.calls[0][0].reason).toBe("error");
        expect(setup.invalidate).not.toHaveBeenCalled();
      });
    });

    describe("when useSubmit stays mounted", () => {
      it("should fire callbacks once with the mapped response", async () => {
        const setup = createSetup();
        mockRequest(setup.submitRequest, { data: { ok: true } });
        const { result, callbacks } = renderSubmit(setup.submitRequest);
        let pending: ReturnType<typeof result.current.submit> | undefined;

        act(() => {
          pending = result.current.submit();
        });
        await waitFor(() => {
          expect(setup.calls).toHaveBeenCalled();
        });
        setup.release();
        await act(async () => {
          await pending;
        });

        await waitFor(() => {
          expect(callbacks.onSuccess).toHaveBeenCalledTimes(1);
        });
        expect(callbacks.onSuccess.mock.calls[0][0].response.data).toStrictEqual({ ok: true, mapped: true });
        expect(callbacks.onFinished).toHaveBeenCalledTimes(1);
        expect(callbacks.onError).not.toHaveBeenCalled();
        expect(setup.invalidate).toHaveBeenCalledTimes(1);
      });
    });

    describe("when useFetch unmounts while the mapper is pending", () => {
      it("should fire no callback after success", async () => {
        const setup = createSetup();
        mockRequest(setup.fetchRequest, { data: { ok: true } });
        const { unmount, callbacks } = renderFetch(setup.fetchRequest);

        await waitFor(() => {
          expect(setup.calls).toHaveBeenCalled();
        });
        unmount();
        setup.release();
        await flushPromises();

        expect(callbacks.onSuccess).not.toHaveBeenCalled();
        expect(callbacks.onError).not.toHaveBeenCalled();
        expect(callbacks.onFinished).not.toHaveBeenCalled();
      });

      it("should fire no callback after error", async () => {
        const setup = createSetup();
        mockRequest(setup.fetchRequest, { status: 400 });
        const { unmount, callbacks } = renderFetch(setup.fetchRequest);

        await waitFor(() => {
          expect(setup.calls).toHaveBeenCalled();
        });
        unmount();
        setup.release();
        await flushPromises();

        expect(callbacks.onSuccess).not.toHaveBeenCalled();
        expect(callbacks.onError).not.toHaveBeenCalled();
        expect(callbacks.onFinished).not.toHaveBeenCalled();
      });
    });

    describe("when useFetch stays mounted", () => {
      it("should fire callbacks once with the mapped response", async () => {
        const setup = createSetup();
        mockRequest(setup.fetchRequest, { data: { ok: true } });
        const { callbacks } = renderFetch(setup.fetchRequest);

        await waitFor(() => {
          expect(setup.calls).toHaveBeenCalled();
        });
        setup.release();

        await waitFor(() => {
          expect(callbacks.onSuccess).toHaveBeenCalledTimes(1);
        });
        expect(callbacks.onSuccess.mock.calls[0][0].response.data).toStrictEqual({ ok: true, mapped: true });
        expect(callbacks.onFinished).toHaveBeenCalledTimes(1);
        expect(callbacks.onError).not.toHaveBeenCalled();
      });
    });
  });
});

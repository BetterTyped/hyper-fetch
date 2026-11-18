import type { OptimisticCallbackResult, OptimisticRollbackArgs, RequestInstance } from "@hyper-fetch/core";
import { Client, scopeKey } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useSubmit } from "hooks/use-submit";
import { StrictMode } from "react";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

type Emitter = Client["requestManager"]["emitter"];

/**
 * Sums the listeners of all events, optionally only of the ones scoped to given request id
 */
const countListeners = (emitter: Emitter, requestId = "") => {
  return emitter
    .eventNames()
    .filter((name) => String(name).includes(requestId))
    .reduce((sum, name) => sum + emitter.listenerCount(name), 0);
};

/**
 * Builds isolated client with a mutation which is settled by the core
 */
const createSetup = () => {
  const client = new Client({ url: "shared-base-url" });
  const list = client.createRequest<{ response: string[] }>()({ endpoint: "/list" });
  const rollback = vi.fn((_args: OptimisticRollbackArgs<RequestInstance>) => undefined);
  const invalidate = vi.spyOn(client.cache, "invalidate");

  const mutation = client
    .createRequest<{ response: { ok: boolean } }>()({ endpoint: "/mutation", method: "POST" })
    .setOptimistic(() => ({ rollback, invalidate: [list] }));

  const dispatcher = client.submitDispatcher;
  const queryKey = scopeKey(mutation.queryKey, mutation.scope);
  const abortKey = scopeKey(mutation.abortKey, mutation.scope);

  return { client, list, mutation, rollback, invalidate, dispatcher, queryKey, abortKey };
};

type Setup = ReturnType<typeof createSetup>;

const createCallbacks = () => ({
  onSubmitSuccess: vi.fn(),
  onSubmitError: vi.fn(),
  onSubmitFinished: vi.fn(),
  onSubmitRequestStart: vi.fn(),
  onSubmitResponseStart: vi.fn(),
  onSubmitDownloadProgress: vi.fn(),
  onSubmitUploadProgress: vi.fn(),
  onSubmitOfflineError: vi.fn(),
  onSubmitAbort: vi.fn(),
});

const expectNoCallbacks = (callbacks: ReturnType<typeof createCallbacks>) => {
  Object.values(callbacks).forEach((callback) => {
    expect(callback).not.toHaveBeenCalled();
  });
};

/**
 * Listeners the core itself keeps for a queued optimistic request sent without any hook
 */
const measureCoreListeners = async () => {
  const { client, mutation, dispatcher, queryKey, abortKey } = createSetup();
  dispatcher.stop(queryKey);
  let requestId = "";

  const pending = mutation.send({
    dispatcherType: "submit",
    onBeforeSent: (data) => {
      requestId = data.requestId;
    },
  });
  await waitFor(() => {
    expect(requestId).not.toBe("");
  });
  const count = countListeners(client.requestManager.emitter, requestId);

  dispatcher.delete(queryKey, requestId, abortKey);
  await pending;

  return count;
};

const modes = [
  { mode: "default", wrapper: undefined },
  { mode: "StrictMode", wrapper: StrictMode },
];

describe("useSubmit [ Unmount ]", () => {
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
    const renderSubmit = <Request extends RequestInstance>(request: Request) => {
      const callbacks = createCallbacks();
      const view = renderHook(() => useSubmit(request), { wrapper });

      act(() => {
        view.result.current.onSubmitSuccess(callbacks.onSubmitSuccess);
        view.result.current.onSubmitError(callbacks.onSubmitError);
        view.result.current.onSubmitFinished(callbacks.onSubmitFinished);
        view.result.current.onSubmitRequestStart(callbacks.onSubmitRequestStart);
        view.result.current.onSubmitResponseStart(callbacks.onSubmitResponseStart);
        view.result.current.onSubmitDownloadProgress(callbacks.onSubmitDownloadProgress);
        view.result.current.onSubmitUploadProgress(callbacks.onSubmitUploadProgress);
        view.result.current.onSubmitOfflineError(callbacks.onSubmitOfflineError);
        view.result.current.onSubmitAbort(callbacks.onSubmitAbort);
      });

      return { ...view, callbacks };
    };

    /**
     * Submits and unmounts in the same tick, so the optimistic callback is still being awaited by the core
     */
    const submitAndUnmount = async (setup: Setup) => {
      const { result, unmount, callbacks } = renderSubmit(setup.mutation);
      let requestId = "";
      let pending: ReturnType<typeof result.current.submit> | undefined;

      act(() => {
        pending = result.current.submit({
          onBeforeSent: (data: { requestId: string }) => {
            requestId = data.requestId;
          },
        });
        unmount();
      });
      await waitFor(() => {
        expect(requestId).not.toBe("");
      });

      return { requestId, callbacks, pending: pending as NonNullable<typeof pending> };
    };

    const expectNoRequestListeners = async (setup: Setup, requestId: string) => {
      await waitFor(() => {
        expect(countListeners(setup.client.requestManager.emitter, requestId)).toBe(0);
      });
    };

    describe("when unmounted in the same tick as submit", () => {
      it("should not attach listeners for the pending request", async () => {
        const coreListeners = await measureCoreListeners();
        const setup = createSetup();
        mockRequest(setup.mutation, { data: { ok: true } });
        setup.dispatcher.stop(setup.queryKey);

        const { requestId, pending } = await submitAndUnmount(setup);

        expect(countListeners(setup.client.requestManager.emitter, requestId)).toBe(coreListeners);

        setup.dispatcher.start(setup.queryKey);
        await pending;
        await expectNoRequestListeners(setup, requestId);
      });

      it("should invalidate once and fire no callback after success", async () => {
        const setup = createSetup();
        mockRequest(setup.mutation, { data: { ok: true } });

        const { requestId, callbacks, pending } = await submitAndUnmount(setup);
        const response = await pending;

        expect(response.success).toBeTrue();
        expectNoCallbacks(callbacks);
        expect(setup.rollback).not.toHaveBeenCalled();
        expect(setup.invalidate).toHaveBeenCalledTimes(1);
        expect(setup.invalidate).toHaveBeenCalledWith(setup.list);
        await expectNoRequestListeners(setup, requestId);
      });

      it("should roll back once and fire no callback after error", async () => {
        const setup = createSetup();
        mockRequest(setup.mutation, { status: 400 });

        const { requestId, callbacks, pending } = await submitAndUnmount(setup);
        const response = await pending;

        expect(response.status).toBe(400);
        expectNoCallbacks(callbacks);
        expect(setup.rollback).toHaveBeenCalledTimes(1);
        expect(setup.rollback.mock.calls[0][0].reason).toBe("error");
        expect(setup.invalidate).not.toHaveBeenCalled();
        await expectNoRequestListeners(setup, requestId);
      });

      it("should roll back once and fire no callback after abort", async () => {
        const setup = createSetup();
        mockRequest(setup.mutation, { data: { ok: true }, delay: 100 });

        const { requestId, callbacks, pending } = await submitAndUnmount(setup);
        await waitFor(() => {
          expect(setup.dispatcher.getAllRunningRequests()).toHaveLength(1);
        });
        setup.mutation.abort();
        await pending;

        expectNoCallbacks(callbacks);
        expect(setup.rollback).toHaveBeenCalledTimes(1);
        expect(setup.rollback.mock.calls[0][0].reason).toBe("abort");
        await expectNoRequestListeners(setup, requestId);
      });

      it("should roll back once when removed from the queue", async () => {
        const setup = createSetup();
        setup.dispatcher.stop(setup.queryKey);

        const { requestId, callbacks, pending } = await submitAndUnmount(setup);
        setup.dispatcher.delete(setup.queryKey, requestId, setup.abortKey);
        await pending;

        expectNoCallbacks(callbacks);
        expect(setup.rollback).toHaveBeenCalledTimes(1);
        expect(setup.rollback.mock.calls[0][0].reason).toBe("removed");
        await expectNoRequestListeners(setup, requestId);
      });

      it("should fire no callback when the optimistic callback resolves after unmount", async () => {
        const setup = createSetup();
        let resolveOptimistic: (value: OptimisticCallbackResult<undefined>) => void = () => undefined;
        const request = setup.mutation.setOptimistic(
          () =>
            new Promise<OptimisticCallbackResult<undefined>>((resolve) => {
              resolveOptimistic = resolve;
            }),
        );
        mockRequest(request, { status: 400 });
        const { result, unmount, callbacks } = renderSubmit(request);
        let pending: ReturnType<typeof result.current.submit> | undefined;

        act(() => {
          pending = result.current.submit();
        });
        unmount();
        resolveOptimistic({ rollback: setup.rollback });
        await pending;

        expectNoCallbacks(callbacks);
        expect(setup.rollback).toHaveBeenCalledTimes(1);
      });
    });

    describe("when submitted after unmount", () => {
      it("should settle the request and leave no listeners behind", async () => {
        const setup = createSetup();
        mockRequest(setup.mutation, { status: 400 });
        const requestListeners = countListeners(setup.client.requestManager.emitter);
        const cacheListeners = countListeners(setup.client.cache.emitter);
        const { result, unmount, callbacks } = renderSubmit(setup.mutation);

        unmount();
        const response = await result.current.submit();

        expect(response.status).toBe(400);
        expectNoCallbacks(callbacks);
        expect(setup.rollback).toHaveBeenCalledTimes(1);
        await waitFor(() => {
          expect(countListeners(setup.client.requestManager.emitter)).toBe(requestListeners);
        });
        expect(countListeners(setup.client.cache.emitter)).toBe(cacheListeners);
      });
    });

    describe("when staying mounted", () => {
      it("should keep delivering callbacks", async () => {
        const setup = createSetup();
        mockRequest(setup.mutation, { data: { ok: true } });
        const { result, callbacks } = renderSubmit(setup.mutation);

        await act(async () => {
          await result.current.submit();
        });

        await waitFor(() => {
          expect(callbacks.onSubmitSuccess).toHaveBeenCalledTimes(1);
        });
        expect(callbacks.onSubmitFinished).toHaveBeenCalledTimes(1);
        expect(callbacks.onSubmitRequestStart).toHaveBeenCalledTimes(1);
        expect(callbacks.onSubmitError).not.toHaveBeenCalled();
      });

      it("should keep receiving cache updates", async () => {
        const setup = createSetup();
        mockRequest(setup.mutation, { data: { ok: true } });
        const { result } = renderHook(() => useSubmit(setup.mutation, { dependencyTracking: false }), { wrapper });

        await act(async () => {
          await result.current.submit();
        });

        await waitFor(() => {
          expect(result.current.data).toStrictEqual({ ok: true });
        });
      });
    });
  });
});

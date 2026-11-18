import { Client } from "client";
import type { ClientOptionsType } from "client";
import type { RequestInstance } from "request";

export type ControlledCall = {
  request: RequestInstance;
  requestId: string;
  /** True once the call got its outcome - success, error or abort */
  isSettled: () => boolean;
  isAborted: () => boolean;
  succeed: (data?: unknown, status?: number) => Promise<void>;
  fail: (error?: unknown, status?: number) => Promise<void>;
};

/**
 * Client with an adapter which never answers on its own. Every request that reaches the adapter is listed in
 * `calls` and stays "in flight" until the test decides about its outcome, so tests do not depend on timing.
 */
export const createControlledClient = (options?: Partial<ClientOptionsType<any>>) => {
  const client = new Client({ url: "http://controlled", ...options });
  const calls: ControlledCall[] = [];
  const extra = { headers: {} };
  const defaultData: unknown = { ok: true };
  const defaultError: unknown = { message: "Failed" };

  client.adapter.setFetcher(
    async ({
      request,
      requestId,
      onSuccess,
      onError,
      createAbortListener,
      onBeforeRequest,
      onRequestStart,
      onRequestEnd,
      onResponseStart,
      onResponseEnd,
    }) => {
      let settled = false;
      let aborted = false;

      const unmountListener = createAbortListener({
        status: 0,
        extra,
        onAbort: () => {
          settled = true;
          aborted = true;
        },
      });

      const settle = () => {
        settled = true;
        unmountListener();
        onRequestEnd();
        onResponseStart();
        onResponseEnd();
      };

      const call: ControlledCall = {
        request,
        requestId,
        isSettled: () => settled,
        isAborted: () => aborted,
        succeed: async (data = defaultData, status = 200) => {
          if (settled) {
            return;
          }
          settle();
          await onSuccess({ data, status, extra });
        },
        fail: async (error = defaultError, status = 500) => {
          if (settled) {
            return;
          }
          settle();
          await onError({ error, status, extra });
        },
      };

      if (aborted) {
        return;
      }

      onBeforeRequest();
      onRequestStart();
      calls.push(call);
    },
  );

  /** Calls which wait for the test to answer them */
  const getPending = () => calls.filter((call) => !call.isSettled());

  return { client, calls, getPending };
};

export const createDeferred = <T = void>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
};

const pendingMark = Symbol("pending");

/**
 * Tells if a promise is still pending after everything that was already scheduled has run.
 * Works with the fake timers - no time has to pass.
 */
export const isPending = async (promise: Promise<unknown>) => {
  await vi.advanceTimersByTimeAsync(0);
  const result = await Promise.race([promise, Promise.resolve(pendingMark)]);
  return result === pendingMark;
};

/** Let all the already scheduled promise callbacks run (requires fake timers) */
export const flushPromises = async () => {
  await vi.advanceTimersByTimeAsync(0);
};

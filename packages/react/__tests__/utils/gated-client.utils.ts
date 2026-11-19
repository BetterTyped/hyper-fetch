import type { RequestInstance } from "@hyper-fetch/core";
import { Client } from "@hyper-fetch/core";
import { act, waitFor } from "@testing-library/react";

/**
 * Deterministic test transport.
 *
 * Every request sent through the gated client stays "in flight" until the test settles it, so there are no mock
 * delays and nothing depends on how fast the machine is. Each attempt (first try and every retry) is a separate call.
 */
export type GatedCall = {
  /** Position of the call in the order requests reached the adapter (0-based) */
  index: number;
  requestId: string;
  request: RequestInstance;
  payload: unknown;
  /** True once the request got aborted by the library */
  aborted: boolean;
  /** True once the call was answered or aborted */
  settled: boolean;
  /** Answer the request with a successful response */
  succeed: (data?: unknown, status?: number) => void;
  /** Answer the request with an error response */
  fail: (error?: unknown, status?: number) => void;
  /** Report upload progress */
  upload: (loaded: number, total: number) => void;
  /** Report download progress */
  download: (loaded: number, total: number) => void;
};

const gatedExtra = { headers: { "content-type": "application/json" } };

export const createGatedClient = (options?: { url?: string }) => {
  const calls: GatedCall[] = [];

  const client = new Client({ url: options?.url ?? "http://gated-client" });

  client.adapter.setFetcher(
    async ({
      request,
      requestId,
      payload,
      onBeforeRequest,
      onRequestStart,
      onRequestProgress,
      onRequestEnd,
      onResponseStart,
      onResponseProgress,
      onResponseEnd,
      onSuccess,
      onError,
      createAbortListener,
    }) => {
      const call: GatedCall = {
        index: calls.length,
        requestId,
        request,
        payload,
        aborted: false,
        settled: false,
        succeed: (data, status = 200) => {
          if (call.settled) {
            return;
          }
          call.settled = true;
          onRequestEnd();
          onResponseStart();
          onResponseEnd();
          onSuccess({ data: data === undefined ? { ok: true } : data, status, extra: gatedExtra } as never);
        },
        fail: (error, status = 400) => {
          if (call.settled) {
            return;
          }
          call.settled = true;
          onRequestEnd();
          onResponseStart();
          onResponseEnd();
          onError({
            error: error === undefined ? { message: "Gated error" } : error,
            status,
            extra: gatedExtra,
          } as never);
        },
        upload: (loaded, total) => {
          if (call.settled) {
            return;
          }
          onRequestProgress({ loaded, total });
        },
        download: (loaded, total) => {
          if (call.settled) {
            return;
          }
          onResponseProgress({ loaded, total });
        },
      };

      createAbortListener({
        status: 0,
        extra: gatedExtra,
        onAbort: () => {
          call.aborted = true;
          call.settled = true;
        },
      } as never);

      calls.push(call);

      if (!call.settled) {
        onBeforeRequest();
        onRequestStart();
      }
    },
  );

  /** Wait until the n-th call (0-based) reached the adapter and return it */
  const waitForCall = async (index: number): Promise<GatedCall> => {
    await waitFor(() => {
      expect(calls.length).toBeGreaterThan(index);
    });
    return calls[index];
  };

  /** Wait until exactly `count` calls reached the adapter */
  const waitForCalls = async (count: number): Promise<GatedCall[]> => {
    await waitFor(() => {
      expect(calls).toHaveLength(count);
    });
    return calls;
  };

  /** Calls that are still waiting for an answer */
  const pending = () => calls.filter((call) => !call.settled);

  return { client, calls, pending, waitForCall, waitForCalls, extra: gatedExtra };
};

/** Flush promise callbacks (and the effects they schedule) without waiting for real time to pass */
export const flushPromises = async (rounds = 5) => {
  await act(async () => {
    for (let i = 0; i < rounds; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.resolve();
    }
  });
};

/** Promise that the test resolves by hand */
export const createDeferred = <T = void>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

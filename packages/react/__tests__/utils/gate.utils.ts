import type { ExtractResponseType, RequestInstance } from "@hyper-fetch/core";
import { act } from "@testing-library/react";

export type GatedCall<Response = any> = {
  /** Request instance received by the adapter */
  request: RequestInstance;
  requestId: string;
  /** Resolve the call with a success response */
  succeed: (data: Response, status?: number) => void;
  /** Resolve the call with an error response */
  fail: (error?: Error, status?: number) => void;
};

/**
 * Attaches a mock that keeps every call pending until the test decides how it ends.
 * No network and no default delays are involved - the order of responses is set by the test, not by timing.
 * The mock is shared with the clones of the request (setParams, setQueryParams etc.).
 */
export const gateRequest = <T extends RequestInstance>(request: T) => {
  const calls: GatedCall<ExtractResponseType<T>>[] = [];

  request.setMock(
    ({ request: sentRequest, requestId }: { request: RequestInstance; requestId: string }) => {
      return new Promise<any>((resolve) => {
        calls.push({
          request: sentRequest,
          requestId,
          succeed: (data, status = 200) => resolve({ data, status }),
          fail: (error = new Error("Gated error"), status = 400) => resolve({ error, status, success: false }),
        });
      });
    },
    { requestTime: 0, responseTime: 0 },
  );

  return calls;
};

/**
 * Time needed by the mocker to pass the upload and download phases once the gate is opened
 */
export const GATE_SETTLE_TIME = 50;

/**
 * Moves the fake clock forward inside of act(), flushing the promises between the timers.
 * Requires `vi.useFakeTimers()`.
 */
export const advance = async (time = 0) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(time);
  });
};

/**
 * Lets the response of opened gates travel through the mocker, dispatcher and cache into the hooks.
 */
export const settle = async () => {
  await advance(GATE_SETTLE_TIME);
};

/**
 * Saves a success response in the cache, the same way the dispatcher does it.
 */
export const setCacheResponse = <T extends RequestInstance>(
  request: T,
  data: ExtractResponseType<T>,
  timestamp: number = Date.now(),
) => {
  const response = {
    data,
    error: null,
    status: 200,
    success: true,
    extra: request.client.adapter.defaultExtra,
    requestTimestamp: timestamp,
    responseTimestamp: timestamp,
    addedTimestamp: timestamp,
    triggerTimestamp: timestamp,
    retries: 0,
    isCanceled: false,
    isOffline: false,
    willRetry: false,
  };
  request.client.cache.set(request, response as any);
};

/**
 * Number of listeners registered on the client emitters - used to prove that hooks clean up after themselves.
 */
export const countListeners = (client: RequestInstance["client"]) => {
  const count = (emitter: {
    eventNames: () => (string | symbol)[];
    listenerCount: (name: string | symbol) => number;
  }) => emitter.eventNames().reduce((sum, name) => sum + emitter.listenerCount(name), 0);

  return {
    requestManager: count(client.requestManager.emitter),
    cache: count(client.cache.emitter),
    appManager: count(client.appManager.emitter),
    fetchDispatcher: count(client.fetchDispatcher.emitter),
    submitDispatcher: count(client.submitDispatcher.emitter),
  };
};

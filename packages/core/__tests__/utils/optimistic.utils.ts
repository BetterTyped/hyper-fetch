import { waitFor } from "@testing-library/dom";

import type { ClientInstance } from "client";
import { Client } from "client";
import type { RequestInstance } from "request";
import { scopeKey } from "request";

export type Todo = { id: number; title: string; done: boolean; likes: number };
export type Stats = { total: number; done: number };

export const createTodo = (id: number, extra: Partial<Todo> = {}): Todo => ({
  id,
  title: `todo-${id}`,
  done: false,
  likes: 0,
  ...extra,
});

/**
 * Puts the data to the cache the same way a successful response does
 */
export const seedCache = (client: ClientInstance, request: RequestInstance, data: unknown) => {
  const now = Date.now();
  client.cache.set(request, {
    data,
    error: null,
    status: 200,
    success: true,
    extra: client.adapter.defaultExtra,
    retries: 0,
    isCanceled: false,
    isOffline: false,
    willRetry: false,
    addedTimestamp: now,
    triggerTimestamp: now,
    requestTimestamp: now,
    responseTimestamp: now,
  });
};

export const readCache = <Data>(client: ClientInstance, request: RequestInstance): Data | undefined => {
  return client.cache.get<Data, unknown>(scopeKey(request.cacheKey, request.scope))?.data ?? undefined;
};

export type ControlledResponse = { data?: unknown; error?: unknown; status?: number };

export type ControlledCall = {
  request: RequestInstance;
  requestId: string;
  /** Answers the request - an `error` makes it fail */
  respond: (response: ControlledResponse) => void;
};

/**
 * Client whose requests wait until the test answers them, so the order of responses is decided by the test and not by
 * timers. Only the network part of the adapter is replaced, everything else runs for real.
 */
export const createControlledClient = () => {
  const client = new Client({ url: "shared-base-url" });
  const calls: ControlledCall[] = [];

  client.adapter.setFetcher(({ request, requestId, onSuccess, onError, createAbortListener }) => {
    let isFinished = false;
    const extra = client.adapter.defaultExtra;
    createAbortListener({
      status: 0,
      extra,
      onAbort: () => {
        isFinished = true;
      },
    });
    calls.push({
      request,
      requestId,
      respond: ({ data = null, error, status }) => {
        if (isFinished) {
          return;
        }
        isFinished = true;
        if (error) {
          onError({ error, status: status ?? 500, extra });
        } else {
          onSuccess({ data, status: status ?? 200, extra });
        }
      },
    });
  });

  /** Waits until the n-th call (0-based) reaches the network */
  const waitForCall = async (index: number) => {
    await waitFor(
      () => {
        expect(calls.length).toBeGreaterThan(index);
      },
      { interval: 1 },
    );
    return calls[index];
  };

  return { client, calls, waitForCall };
};

/** Deterministic PRNG (Park-Miller), so randomized specs can be replayed from the seed */
export const createRandom = (seed: number) => {
  const modulus = 2_147_483_647;
  let state = seed % modulus || 1;
  const next = () => {
    state = (state * 48_271) % modulus;
    return state / modulus;
  };
  const int = (max: number) => Math.floor(next() * max);
  const pick = <T>(values: readonly T[]): T => values[int(values.length)];
  return { next, int, pick };
};

/** Every order of the given values */
export const permutations = <T>(values: T[]): T[][] => {
  if (values.length <= 1) {
    return [values];
  }
  return values.flatMap((value, index) =>
    permutations([...values.slice(0, index), ...values.slice(index + 1)]).map((rest) => [value, ...rest]),
  );
};

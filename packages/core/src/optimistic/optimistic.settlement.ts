import type { AdapterInstance, ResponseSuccessType, ResponseType } from "adapter";
import type { CacheValueType } from "cache";
import type { ClientInstance } from "client";
import type {
  OptimisticCallbackResult,
  OptimisticCallbackReturnType,
  OptimisticRollbackArgs,
  RequestInstance,
} from "request";
import { getRequestKey, scopeKey, stringifyKey } from "request";

import { OptimisticOperation } from "./optimistic";

/**
 * Settlement of optimistic updates.
 *
 * Every cache key changed by pending mutations has a counter. While it is above zero, fetch responses for the key are
 * not written to the cache, and fetches still running when a mutation on the key settles are marked as stale - they
 * started before the change was confirmed or reverted. Once the last mutation settles and the stale fetches are done,
 * the key is refreshed (invalidated) once, so the server's data replaces the optimistic value.
 */

type KeyState = {
  /** Mutations still pending on the key */
  pending: number;
  /** A settled mutation asked for the refresh */
  refresh: boolean;
  /** Request used to invalidate the key */
  request: RequestInstance;
};

type ClientState = {
  keys: Map<string, KeyState>;
  /** Running fetches that started before a mutation on their key settled - request id to storage key */
  staleRequests: Map<string, string>;
};

type AppliedOperation = {
  operation: OptimisticOperation<unknown, RequestInstance>;
  storageKey: string;
  /** Request of the changed entry */
  request: RequestInstance;
  previous: unknown;
};

/** @internal State of one mutation's optimistic updates, from applying them until the mutation settles */
export type OptimisticPendingType = {
  client: ClientInstance;
  result: OptimisticCallbackResult<unknown>;
  applied: AppliedOperation[];
  /** Every key the operations target, with the request used to refresh it */
  targets: Map<string, RequestInstance>;
  /** Keys changed by the operations - their fetch responses are held back until the mutation settles */
  guarded: Set<string>;
  /** Keys where user code failed - refreshed whatever the outcome */
  failed: Set<string>;
};

/** @internal How the mutation settled */
export type OptimisticOutcomeType =
  | { type: "success"; response: ResponseType<any, any, AdapterInstance>; request: RequestInstance }
  | ({ type: "rollback" } & OptimisticRollbackArgs<RequestInstance>);

const clientStates = new WeakMap<ClientInstance, ClientState>();

const getClientState = (client: ClientInstance): ClientState => {
  let state = clientStates.get(client);
  if (!state) {
    state = { keys: new Map(), staleRequests: new Map() };
    clientStates.set(client, state);
  }
  return state;
};

const logFailure = (client: ClientInstance, title: string, extra: Record<string, unknown>) => {
  client.logger.error({ title, type: "system", extra });
};

const readEntry = (client: ClientInstance, storageKey: string) => {
  return client.cache.get<unknown, unknown>(storageKey);
};

/**
 * Writes the data through the regular cache path, so listeners get one event per change. The entry keeps its
 * timestamps and staleness - an optimistic value doesn't make the entry fresh.
 */
const writeData = (request: RequestInstance, entry: CacheValueType<unknown, unknown, AdapterInstance>, data: unknown) => {
  const entryRequest = request.clone({ staleTime: entry.staleTime, cacheTime: entry.cacheTime }) as RequestInstance;
  request.client.cache.set(entryRequest, { ...entry, data });
};

/**
 * Cache keys targeted by the operation. `optimistic.all()` matches every entry of the same method and endpoint
 * whatever the query params; a custom cache key matches itself and the keys derived from it (infinite pages).
 */
const resolveTargets = (client: ClientInstance, operation: OptimisticOperation<unknown, RequestInstance>) => {
  const { target } = operation;
  const targets = new Map<string, RequestInstance>();

  if (!operation.allVariants) {
    targets.set(scopeKey(target.cacheKey, target.scope), target);
    return targets;
  }

  const isGeneratedKey = target.cacheKey === getRequestKey(target);
  const prefix = isGeneratedKey
    ? `${stringifyKey(target.method)}_${stringifyKey(target.endpoint)}_`
    : `${target.cacheKey}_`;

  client.cache.keys().forEach((storageKey) => {
    const entry = client.cache.storage.get<unknown, unknown, AdapterInstance>(storageKey);
    if (!entry || entry.scope !== target.scope) {
      return;
    }
    if (entry.cacheKey === target.cacheKey) {
      targets.set(storageKey, target);
    } else if (entry.cacheKey.startsWith(prefix)) {
      // `setCacheKey` marks the instance it is called on - a clone keeps the user's request untouched
      targets.set(storageKey, target.clone().setCacheKey(entry.cacheKey) as RequestInstance);
    }
  });

  return targets;
};

/**
 * Runs `.rollback()` / `.commit()` of an operation and writes what it returned. User code can't break the settlement:
 * a throw or a promise is reported and the key gets refreshed.
 */
const runSettleCallback = (
  pending: OptimisticPendingType,
  { operation, storageKey, request, previous }: AppliedOperation,
  outcome: OptimisticOutcomeType,
) => {
  const { client } = pending;
  const entry = readEntry(client, storageKey);
  const isCommit = outcome.type === "success";
  const title = isCommit ? "Optimistic commit failed" : "Optimistic rollback failed";
  const run = (data: unknown) => {
    if (outcome.type === "success") {
      const response = outcome.response as ResponseSuccessType<unknown, AdapterInstance>;
      return operation.onCommit?.({ data, response, request: outcome.request });
    }
    const { type: _type, ...args } = outcome;
    return operation.onRollback?.({ ...args, data, previous });
  };

  // Entry deleted or cache cleared in the meantime - there is nothing to update
  if (!(isCommit ? operation.onCommit : operation.onRollback) || !entry) {
    return;
  }

  try {
    const next = run(entry.data);

    if (next instanceof Promise) {
      next.catch((error: unknown) => logFailure(client, title, { error, storageKey }));
      throw new TypeError("Optimistic rollback and commit must be synchronous, the returned promise was ignored");
    }
    if (next !== undefined && next !== entry.data) {
      writeData(request, entry, next);
    }
  } catch (error) {
    logFailure(client, title, { error, storageKey, request: outcome.request });
    pending.failed.add(storageKey);
  }
};

/** Rollback of the hand-written object form - runs once, its failure can't affect the request */
const runObjectRollback = (pending: OptimisticPendingType, args: OptimisticRollbackArgs<RequestInstance>) => {
  const { client, result } = pending;
  const onFailure = (error: unknown) => {
    logFailure(client, "Optimistic rollback failed", { error, reason: args.reason, request: args.request });
  };

  try {
    // Async rollback is not awaited, but its rejection can't stay unhandled
    Promise.resolve(result.rollback?.(args)).catch(onFailure);
  } catch (error) {
    onFailure(error);
  }
};

const runObjectInvalidation = ({ client, result }: OptimisticPendingType, request: RequestInstance) => {
  result.invalidate?.forEach((target) => {
    try {
      client.cache.invalidate(target);
    } catch (error) {
      logFailure(client, "Optimistic invalidation failed", { error, target, request });
    }
  });
};

/**
 * `rollbackOnError` decides about final errors only - aborted and removed requests are always reverted.
 * A predicate that throws is reported and the change is reverted.
 */
const shouldRollback = (pending: OptimisticPendingType, outcome: OptimisticRollbackArgs<RequestInstance>) => {
  const { rollbackOnError } = pending.result;
  if (outcome.reason !== "error" || rollbackOnError === undefined || rollbackOnError === true) {
    return true;
  }
  if (rollbackOnError === false) {
    return false;
  }
  try {
    return !!rollbackOnError({ response: outcome.response, request: outcome.request });
  } catch (error) {
    logFailure(pending.client, "Optimistic rollbackOnError failed", { error, request: outcome.request });
    return true;
  }
};

const getRunningRequestsOnKey = (client: ClientInstance, storageKey: string) => {
  return [...client.fetchDispatcher.getAllRunningRequests(), ...client.submitDispatcher.getAllRunningRequests()].filter(
    ({ request }) => scopeKey(request.cacheKey, request.scope) === storageKey,
  );
};

const hasStaleRequests = (state: ClientState, storageKey: string) => {
  return [...state.staleRequests.values()].includes(storageKey);
};

/** Refreshes the key once nothing pending or stale is left on it */
const refreshWhenIdle = (client: ClientInstance, state: ClientState, storageKey: string) => {
  const keyState = state.keys.get(storageKey);
  if (!keyState || keyState.pending > 0 || hasStaleRequests(state, storageKey)) {
    return;
  }
  state.keys.delete(storageKey);
  if (keyState.refresh) {
    client.cache.invalidate(keyState.request);
  }
};

const release = (pending: OptimisticPendingType, refresh: boolean) => {
  const { client, targets, failed, guarded } = pending;
  const state = getClientState(client);

  targets.forEach((request, storageKey) => {
    const keyState = state.keys.get(storageKey);
    const shouldRefresh = refresh || failed.has(storageKey);

    if (!guarded.has(storageKey)) {
      // Nothing was changed here - refresh together with the mutations still pending on the key, or right away
      if (keyState && shouldRefresh) {
        keyState.refresh = true;
      } else if (shouldRefresh) {
        client.cache.invalidate(request);
      }
      return;
    }
    // State was reset by clearing the client
    if (!keyState) {
      return;
    }
    keyState.pending -= 1;
    keyState.refresh = keyState.refresh || shouldRefresh;
    keyState.request = request;

    getRunningRequestsOnKey(client, storageKey).forEach(({ requestId }) => {
      state.staleRequests.set(requestId, storageKey);
    });

    refreshWhenIdle(client, state, storageKey);
  });
};

/**
 * @internal
 * Normalizes what `setOptimistic` or the `optimistic` send option returned into the object form.
 */
export const getOptimisticResult = (
  value: OptimisticCallbackReturnType<unknown, RequestInstance> | undefined,
): OptimisticCallbackResult<unknown> => {
  if (Array.isArray(value)) {
    return { updates: value };
  }
  return value || {};
};

/**
 * @internal
 * Applies the operations of the mutation and registers its target keys as pending. A failing operation is reported,
 * the others still apply.
 */
export const applyOptimistic = (
  client: ClientInstance,
  result: OptimisticCallbackResult<unknown>,
): OptimisticPendingType => {
  const pending: OptimisticPendingType = {
    client,
    result,
    applied: [],
    targets: new Map(),
    guarded: new Set(),
    failed: new Set(),
  };
  const state = getClientState(client);

  result.updates?.forEach((value) => {
    try {
      if (!(value instanceof OptimisticOperation)) {
        throw new TypeError("Optimistic updates accept operations created with optimistic()");
      }
      const operation = value as OptimisticOperation<unknown, RequestInstance>;

      resolveTargets(client, operation).forEach((request, storageKey) => {
        pending.targets.set(storageKey, request);
        const entry = readEntry(client, storageKey);
        // No data yet - there is nothing to change and nothing to revert
        if (!entry) {
          return;
        }
        try {
          const next = operation.update(entry.data);
          if (next !== entry.data) {
            writeData(request, entry, next);
          }
          pending.applied.push({ operation, storageKey, request, previous: entry.data });
          pending.guarded.add(storageKey);
        } catch (error) {
          logFailure(client, "Optimistic update failed", { error, storageKey });
          pending.failed.add(storageKey);
        }
      });
    } catch (error) {
      logFailure(client, "Optimistic update failed", { error, operation: value });
    }
  });

  pending.guarded.forEach((storageKey) => {
    const request = pending.targets.get(storageKey) as RequestInstance;
    const keyState = state.keys.get(storageKey) ?? { pending: 0, refresh: false, request };
    keyState.pending += 1;
    state.keys.set(storageKey, keyState);
  });

  return pending;
};

/**
 * @internal
 * Settles the mutation once. Success runs the commits and invalidations, a final error, abort or queue removal runs the
 * rollbacks in reverse order of application. The targets get refreshed after the last pending mutation on them.
 */
export const settleOptimistic = (pending: OptimisticPendingType, outcome: OptimisticOutcomeType) => {
  const { result, applied } = pending;
  const canRefresh = result.revalidate !== false;

  if (outcome.type === "success") {
    applied.forEach((operation) => runSettleCallback(pending, operation, outcome));
    runObjectInvalidation(pending, outcome.request);
    return release(pending, canRefresh);
  }

  const { type: _type, ...args } = outcome;
  if (!shouldRollback(pending, args)) {
    return release(pending, false);
  }

  // The latest change is reverted first
  for (let index = applied.length - 1; index >= 0; index -= 1) {
    runSettleCallback(pending, applied[index], outcome);
  }
  runObjectRollback(pending, args);
  return release(pending, canRefresh);
};

/**
 * @internal
 * Stale response guard, called where the dispatcher writes a response to the cache. A response is discarded when a
 * mutation changed its key and is pending, or when the fetch started before the latest such mutation settled - the
 * refresh after the mutation supplies current data. Keys that had no data when the change was applied are not
 * guarded, so a first load is never held back. Manual cache writes don't go through this check.
 */
export const isStaleOptimisticResponse = (
  client: ClientInstance,
  request: RequestInstance,
  requestId: string,
): boolean => {
  const state = clientStates.get(client);
  if (!state) {
    return false;
  }

  const storageKey = scopeKey(request.cacheKey, request.scope);
  const isMarked = state.staleRequests.delete(requestId);
  const isPending = (state.keys.get(storageKey)?.pending ?? 0) > 0;
  if (isMarked) {
    refreshWhenIdle(client, state, storageKey);
  }

  return isMarked || isPending;
};

/** @internal Drops the pending state of the client, its mutations will never settle after clearing it */
export const resetOptimisticState = (client: ClientInstance) => {
  clientStates.delete(client);
};

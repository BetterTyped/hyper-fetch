import type { RequestInstance } from "@hyper-fetch/core";
import { getRequestDispatcher, scopeKey } from "@hyper-fetch/core";

/**
 * Cancel one sent request, whatever it is doing: streaming, waiting in the queue for the network to come back or
 * waiting to be retried. Removing it from its dispatcher queue aborts the connection when there is one and makes
 * sure it is never sent (again) later - aborting by request id alone only reaches requests that are running.
 */
export const cancelRequest = (request: RequestInstance, requestId: string) => {
  const [dispatcher] = getRequestDispatcher(request);
  const abortKey = scopeKey(request.abortKey, request.scope);
  dispatcher.delete(scopeKey(request.queryKey, request.scope), requestId, abortKey);
  // Covers a request that is running but no longer queued
  request.client.requestManager.abortByRequestId(abortKey, requestId);
};

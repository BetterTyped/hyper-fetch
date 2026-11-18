import type { RequestInstance } from "@hyper-fetch/core";
import { getErrorMessage, mapResponseForSend, scopeKey } from "@hyper-fetch/core";

type LoadPageOptions = {
  request: RequestInstance;
  /** Skips requests started before this fetch was asked for */
  force: boolean;
  /** Filled with the functions stopping this fetch */
  cancellers: Set<VoidFunction>;
  isCancelled: () => boolean;
};

/**
 * Cancelled pages are not failures: the list simply did not need them anymore
 */
export const isCancelledResponse = (response: any) => {
  const message = response?.error?.message;
  return (
    !response?.success &&
    (message === getErrorMessage("abort").message || message === getErrorMessage("deleted").message)
  );
};

/**
 * Joins a request started elsewhere. Cancelling only stops waiting, the request belongs to someone else.
 */
const waitForResponse = (request: RequestInstance, requestId: string, cancellers: Set<VoidFunction>) => {
  const { requestManager } = request.client;

  return new Promise<any>((resolve) => {
    const finish = (response: any) => {
      unmountResponse();
      unmountRemove();
      cancellers.delete(cancel);
      resolve(response);
    };
    const cancel = () => finish(null);
    const unmountResponse = requestManager.events.onResponseById(requestId, ({ response, details }) => {
      if (response.success || (!details.willRetry && !details.isOffline)) {
        finish(response);
      }
    });
    const unmountRemove = requestManager.events.onRemoveById(requestId, cancel);

    cancellers.add(cancel);
  });
};

const sendPage = async ({ request, force, cancellers }: LoadPageOptions) => {
  const { fetchDispatcher } = request.client;
  const pageRequest = force ? request.setDeduplicate(false) : request;
  let cancel: VoidFunction = () => null;

  const response = await (pageRequest as RequestInstance).send({
    dispatcherType: "fetch",
    onBeforeSent: ({ requestId }: { requestId: string }) => {
      cancel = () => {
        fetchDispatcher.delete(
          scopeKey(request.queryKey, request.scope),
          requestId,
          scopeKey(request.abortKey, request.scope),
        );
      };
      cancellers.add(cancel);
    },
  } as any);

  cancellers.delete(cancel);
  return response;
};

/**
 * Loads a page, reusing the request already running for it
 */
export const loadPage = async (options: LoadPageOptions) => {
  const { request, force, cancellers, isCancelled } = options;

  // A forced fetch must not reuse a request started before it was asked for
  if (!force) {
    const running = request.client.fetchDispatcher
      .getRunningRequests(scopeKey(request.queryKey, request.scope))
      .find((item) => item.request.cacheKey === request.cacheKey);

    if (running) {
      const response = await waitForResponse(request, running.requestId, cancellers);
      if (response) {
        return mapResponseForSend(request, response);
      }
      if (isCancelled()) {
        return null;
      }
    }
  }

  return sendPage(options);
};

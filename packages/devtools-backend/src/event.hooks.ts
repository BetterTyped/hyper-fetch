import { ClientInstance } from "@hyper-fetch/core";
import { DevtoolsRequestEvent } from "devtools.types";

// TODO - here add additional event from main devtools class
const applyEvents = (client: ClientInstance) => {
  const unmountOffline = client.appManager.events.onOffline(() => {
    // TODO - gather online = false info
  });

  const unmountOnline = client.appManager.events.onOnline(() => {
    // TODO - gather online = true info
  });

  const unmountOnRequestPause = client.requestManager.events.onAbort(({ requestId, request }) => {
    // TODO - set anceled info
    setCanceled((prev) => [
      ...prev,
      { requestId, queueKey: request.queueKey, cacheKey: request.cacheKey, abortKey: request.abortKey },
    ]);

    // updateQueues();
  });
  const unmountOnFetchQueueChange = client.fetchDispatcher.events.onQueueChange(() => {
    // updateQueues();
  });
  const unmountOnFetchQueueStatusChange = client.fetchDispatcher.events.onQueueStatusChange(() => {
    // updateQueues();
  });
  const unmountOnSubmitQueueChange = client.submitDispatcher.events.onQueueChange(() => {
    // updateQueues();
  });
  const unmountOnSubmitQueueStatusChange = client.submitDispatcher.events.onQueueStatusChange(() => {
    // updateQueues();
  });
  const unmountOnRemove = client.requestManager.events.onRemove(({ requestId, request, resolved }) => {
    if (!resolved) {
      setRemoved((prev) => [
        ...prev,
        { requestId, queueKey: request.queueKey, cacheKey: request.cacheKey, abortKey: request.abortKey },
      ]);
    }
    // updateQueues();
  });
  const unmountOnCacheChange = client.cache.events.onData(() => {
    // handleCacheChange();
  });
  const unmountOnCacheInvalidate = client.cache.events.onInvalidate(() => {
    // handleCacheChange();
  });

  const unmountCacheDelete = client.cache.events.onDelete(() => {
    // handleCacheChange();
  });

  return () => {
    unmountOffline();
    unmountOnline();
    unmountOnResponse();
    unmountOnRequestStart();
    unmountOnRequestPause();
    unmountOnFetchQueueChange();
    unmountOnFetchQueueStatusChange();
    unmountOnSubmitQueueChange();
    unmountOnSubmitQueueStatusChange();
    unmountOnRemove();
    unmountOnCacheChange();
    unmountOnCacheInvalidate();
    unmountCacheDelete();
  };
};

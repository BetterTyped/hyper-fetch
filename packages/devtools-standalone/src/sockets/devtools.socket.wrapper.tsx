import { useListener } from "@hyper-fetch/react";
import { receiveData, socket } from "./socket";
import { Devtools } from "@hyper-fetch/devtools-react";
import { useEffect } from "react";
import { Client } from "@hyper-fetch/core";
import { EventTypes } from "../../types/message.type";

// TODO - standardize emitter events functions to always start with <emit>

export const DevtoolsSocketWrapper = () => {
  const dummyClient = new Client({ url: "http://localhost.dummyhost:5000" });
  const logger = dummyClient.loggerManager.init(`DevtoolsStandalone`);
  const { onEvent } = useListener(receiveData, {});
  useEffect(() => {
    socket.setQuery({ connectionName: "HF_DEVTOOLS_APP" });
    socket.connect();
  }, []);

  onEvent((event) => {
    const { eventType, eventData } = event.data;
    switch (eventType) {
      case EventTypes.ON_REQUEST_START:
        dummyClient.requestManager.events.emitRequestStart(eventData);
        return;
      case EventTypes.ON_REQUEST_REMOVE:
        dummyClient.requestManager.events.emitRemove(eventData);
        return;
      case EventTypes.ON_REQUEST_PAUSE:
        dummyClient.requestManager.events.emitAbort(eventData);
        return;
      case EventTypes.ON_RESPONSE:
        dummyClient.requestManager.events.emitResponse(eventData);
        return;
      case EventTypes.ON_FETCH_QUEUE_CHANGE: {
        const { queueKey } = eventData;
        dummyClient.fetchDispatcher.events.setQueueChanged(queueKey, eventData);
        return;
      }
      case EventTypes.ON_FETCH_QUEUE_STATUS_CHANGE: {
        const { queueKey } = eventData;
        dummyClient.fetchDispatcher.events.setQueueStatusChanged(queueKey, eventData);
        return;
      }
      case EventTypes.ON_SUBMIT_QUEUE_CHANGE: {
        const { queueKey } = eventData;
        dummyClient.submitDispatcher.events.setQueueChanged(queueKey, eventData);
        return;
      }
      case EventTypes.ON_SUBMIT_QUEUE_STATUS_CHANGE: {
        const { queueKey } = eventData;
        dummyClient.submitDispatcher.events.setQueueStatusChanged(queueKey, eventData);
        return;
      }
      case EventTypes.ON_CACHE_CHANGE: {
        dummyClient.cache.events.emitCacheData(eventData);
        return;
      }
      case EventTypes.ON_CACHE_INVALIDATE: {
        dummyClient.cache.events.emitInvalidation(eventData);
        return;
      }
      case EventTypes.ON_CACHE_DELETE: {
        dummyClient.cache.events.emitDelete(eventData);
        return;
      }

      default:
        logger.error(`Unknown event received: ${eventType}`);
    }
  });

  return <Devtools client={dummyClient} />;
};

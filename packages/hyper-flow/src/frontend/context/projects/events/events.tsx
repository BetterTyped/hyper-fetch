import { ClientInstance } from "@hyper-fetch/core";
import { useEmitter, useListener } from "@hyper-fetch/react";
import { useDidMount } from "@reins/hooks";

import { BaseMessage, EmitableCoreEvents, EmitableCustomEvents, MessageType } from "shared/types/messages.types";
import { useConnectionStore } from "frontend/store/project/connection.store";

// TODO - standardize emitter events functions to always start with <emit>
// TODO - think of better handling and not passing all arguments
const handleEvent = ({
  client,
  event,
  setRequestList,
  project,
}: {
  client: ClientInstance;
  event: BaseMessage;
  setRequestList: any;
  project: string;
}) => {
  // TODO change to more generic event handling
  // { entity, eventType, eventData } // => client[entity].events[eventType](eventData)
  const { eventType, eventData } = event.data;
  switch (eventType) {
    case EmitableCoreEvents.ON_REQUEST_START:
      client.requestManager.events.emitRequestStart(eventData);
      return;
    case EmitableCoreEvents.ON_REQUEST_REMOVE:
      client.requestManager.events.emitRemove(eventData);
      return;
    case EmitableCoreEvents.ON_REQUEST_PAUSE:
      client.requestManager.events.emitAbort(eventData);
      return;
    case EmitableCoreEvents.ON_RESPONSE:
      client.requestManager.events.emitResponse(eventData);
      return;
    case EmitableCoreEvents.ON_FETCH_QUEUE_CHANGE: {
      client.fetchDispatcher.events.emitQueueChanged(eventData);
      return;
    }
    case EmitableCoreEvents.ON_FETCH_QUEUE_STATUS_CHANGE: {
      client.fetchDispatcher.events.emitQueueStatusChanged(eventData);
      return;
    }
    case EmitableCoreEvents.ON_SUBMIT_QUEUE_CHANGE: {
      client.submitDispatcher.events.emitQueueChanged(eventData);
      return;
    }
    case EmitableCoreEvents.ON_SUBMIT_QUEUE_STATUS_CHANGE: {
      client.submitDispatcher.events.emitQueueStatusChanged(eventData);
      return;
    }
    case EmitableCoreEvents.ON_CACHE_CHANGE: {
      client.cache.events.emitCacheData(eventData);
      return;
    }
    case EmitableCoreEvents.ON_CACHE_INVALIDATE: {
      client.cache.events.emitInvalidation(eventData);
      return;
    }
    case EmitableCoreEvents.ON_CACHE_DELETE: {
      client.cache.events.emitDelete(eventData);
      return;
    }
    case EmitableCustomEvents.REQUEST_CREATED: {
      setRequestList(project, eventData);
      return;
    }
    default:
      console.error(`Unknown event received: ${eventType}`);
  }
};

export const Events = ({ project }: { project: string }) => {
  const { connections } = useConnectionStore();

  const { client, eventListener, eventEmitter } = connections[project as keyof typeof connections];
  const { onEvent } = useListener(eventListener);
  const { emit } = useEmitter(eventEmitter);

  onEvent((event) => {
    handleEvent({ client, event, setRequestList: () => {}, project });
  });

  useDidMount(() => {
    emit({
      payload: { messageType: MessageType.DEVTOOLS_PLUGIN_CONFIRM, connectionName: project },
    });

    const unmountOnData = client.cache.events.onData((data) => {
      if (!data.isTriggeredExternally) {
        emit({
          payload: {
            messageType: MessageType.HF_DEVTOOLS_EVENT,
            connectionName: project,
            eventData: { ...data },
            eventType: EmitableCoreEvents.ON_CACHE_CHANGE,
          },
        });
      }
    });

    return () => {
      unmountOnData();
    };
  });

  return null;
};

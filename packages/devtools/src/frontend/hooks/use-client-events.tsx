import { ClientInstance } from "@hyper-fetch/core";
import { useListener } from "@hyper-fetch/react";
import { useDidMount } from "@reins/hooks";

import { BaseMessage, EmitableCoreEvents, EmitableCustomEvents, MessageType } from "types/messages.types";
import { useDevtoolsWorkspaces } from "frontend/pages/devtools/devtools.context";

// TODO - standardize emitter events functions to always start with <emit>
// TODO - think of better handling and not passing all arguments
const handleEvent = ({
  client,
  event,
  setRequestList,
  workspace,
}: {
  client: ClientInstance;
  event: BaseMessage;
  setRequestList: any;
  workspace: string;
}) => {
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
      client.fetchDispatcher.events.setQueueChanged(eventData);
      return;
    }
    case EmitableCoreEvents.ON_FETCH_QUEUE_STATUS_CHANGE: {
      client.fetchDispatcher.events.setQueueStatusChanged(eventData);
      return;
    }
    case EmitableCoreEvents.ON_SUBMIT_QUEUE_CHANGE: {
      client.submitDispatcher.events.setQueueChanged(eventData);
      return;
    }
    case EmitableCoreEvents.ON_SUBMIT_QUEUE_STATUS_CHANGE: {
      client.submitDispatcher.events.setQueueStatusChanged(eventData);
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
      setRequestList(workspace, eventData);
      return;
    }
    default:
      console.error(`Unknown event received: ${eventType}`);
  }
};

export const useClientEvents = ({ workspace, client }: { workspace: string; client: ClientInstance }) => {
  const { setRequestList, workspaces } = useDevtoolsWorkspaces("Devtools");

  const { clientSpecificReceiveMessage, clientSpecificSendMessage } = workspaces[workspace];
  const { onEvent } = useListener(clientSpecificReceiveMessage, {});

  onEvent((event) => {
    handleEvent({ client, event, setRequestList, workspace });
  });

  useDidMount(() => {
    clientSpecificSendMessage.emit({
      payload: { messageType: MessageType.DEVTOOLS_CLIENT_CONFIRM, connectionName: workspace },
    });

    const unmountOnData = client.cache.events.onData((data) => {
      if (!data.isTriggeredExternally) {
        clientSpecificSendMessage.emit({
          payload: {
            messageType: MessageType.HF_DEVTOOLS_EVENT,
            connectionName: workspace,
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
};

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
  const { eventData, eventName, eventSource } = event.data;
  switch (eventSource) {
    case "customEvent": {
      return;
    }
    default: {
      const { data, isTriggeredExternally } = eventData;
      client[eventSource].emitter.emit(eventName, data, isTriggeredExternally);
      return;
    }
    case EmitableCustomEvents.REQUEST_CREATED: {
      setRequestList(project, eventData);
      return;
    }
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

    const unmountOnLoading = client.requestManager.events.onLoading((data) => {
      console.log(data);
    });

    return () => {
      unmountOnData();
    };
  });

  return null;
};

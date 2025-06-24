import { ClientInstance } from "@hyper-fetch/core";
import { useEmitter, useListener } from "@hyper-fetch/react";
import { useDidMount } from "@reins/hooks";
import {
  CoreEvents,
  CustomEvents,
  EventSourceType,
  HFEventMessage,
  InternalEvents,
  MessageType,
} from "@hyper-fetch/plugin-devtools";

import { useConnectionStore } from "frontend/store/project/connection.store";

const handleEvent = ({
  client,
  event,
  setRequestList,
  project,
}: {
  client: ClientInstance;
  event: HFEventMessage;
  setRequestList: any;
  project: string;
}) => {
  // TODO change to more generic event handling
  const { eventData, eventName, eventSource, eventType } = event.data;
  switch (eventSource) {
    case EventSourceType.CUSTOM_EVENT: {
      if (eventType === CustomEvents.REQUEST_CREATED) {
        // TODO - move custom event handling to separate function
        setRequestList(project, eventData);
      }
      return;
    }
    default: {
      const { data, isTriggeredExternally } = eventData;
      client[eventSource].emitter.emit(eventName, data, isTriggeredExternally);
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
      payload: { messageType: InternalEvents.APP_INITIALIZED, connectionName: project },
    });

    const unmountOnData = client.cache.events.onData((data) => {
      if (!data.isTriggeredExternally) {
        emit({
          payload: {
            messageType: MessageType.EVENT,
            connectionName: project,
            eventData: { ...data },
            eventType: CoreEvents.ON_CACHE_CHANGE,
          },
        });
      }
    });

    // const unmountOnLoading = client.requestManager.events.onLoading((data) => {
    //   console.log(data);
    // });

    return () => {
      unmountOnData();
    };
  });

  return null;
};

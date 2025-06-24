import { ClientInstance } from "@hyper-fetch/core";
import { useEmitter, useListener } from "@hyper-fetch/react";
import {
  CoreEvents,
  CustomEvents,
  EventSourceType,
  HFEventMessage,
  InternalEvents,
  MessageType,
} from "@hyper-fetch/plugin-devtools";
import { useDidMount } from "@better-hooks/lifecycle";

import { useConnectionStore } from "@/store/applications/connection.store";

const handleEvent = ({
  client,
  event,
  setRequestList,
  application,
}: {
  client: ClientInstance;
  event: HFEventMessage;
  setRequestList: any;
  application: string;
}) => {
  // TODO change to more generic event handling
  const { eventData, eventName, eventSource, eventType, isTriggeredExternally } = event.data;
  switch (eventSource) {
    case EventSourceType.CUSTOM_EVENT: {
      if (eventType === CustomEvents.REQUEST_CREATED) {
        // TODO - move custom event handling to separate function
        setRequestList(application, eventData);
      }
      return;
    }
    default: {
      client[eventSource].emitter.emit(eventName, eventData, isTriggeredExternally);
    }
  }
};

export const Events = ({ application }: { application: string }) => {
  const { connections } = useConnectionStore();

  const { client, eventListener, eventEmitter } = connections[application as keyof typeof connections];
  const { onEvent } = useListener(eventListener);
  const { emit } = useEmitter(eventEmitter);

  onEvent((event) => {
    handleEvent({ client, event, setRequestList: () => {}, application });
  });

  useDidMount(() => {
    emit({
      payload: {
        messageType: MessageType.INTERNAL,
        eventType: InternalEvents.APP_INITIALIZED,
        connectionName: application,
      },
    });

    const unmountOnData = client.cache.events.onData((data) => {
      if (!data.isTriggeredExternally) {
        emit({
          payload: {
            messageType: MessageType.EVENT,
            connectionName: application,
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

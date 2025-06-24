import { useEmitter, useListener } from "@hyper-fetch/react";
import {
  CoreEvents,
  CustomEvents,
  EventSourceType,
  InternalEvents,
  MessageOrigin,
  MessageType,
} from "@hyper-fetch/plugin-devtools";
import { useDidMount } from "@better-hooks/lifecycle";

import { useConnectionStore } from "@/store/applications/connection.store";

export const Events = ({ application }: { application: string }) => {
  const { connections } = useConnectionStore();

  const { client, eventListener, eventEmitter, environment } = connections[application as keyof typeof connections];
  const { onEvent } = useListener(eventListener);
  const { emit } = useEmitter(eventEmitter);

  onEvent((event) => {
    const { eventData, eventName, eventSource, eventType, isTriggeredExternally } = event.data;
    switch (eventSource) {
      case EventSourceType.CUSTOM_EVENT: {
        if (eventType === CustomEvents.REQUEST_CREATED) {
          // TODO - add request list to the store
          // setRequestList(application, eventData);
        }
        return;
      }
      default: {
        client[eventSource].emitter.emit(eventName, eventData, isTriggeredExternally);
      }
    }
  });

  useDidMount(() => {
    emit({
      payload: {
        messageType: MessageType.INTERNAL,
        eventType: InternalEvents.APP_INITIALIZED,
        connectionName: application,
      },
    });

    const unmountOnData = client.cache.events.onData((data, isTriggeredExternally?: boolean) => {
      console.log("onData", data, isTriggeredExternally);
      // We don't want to return the events sent to the user's application
      // It would cause infinite loop and conflicts because of latency
      if (!isTriggeredExternally) {
        return;
      }

      emit({
        payload: {
          eventSource: EventSourceType.CACHE,
          eventName: CoreEvents.ON_CACHE_CHANGE,
          data,
          isTriggeredExternally,
          environment,
          origin: MessageOrigin.APP,
          messageType: MessageType.EVENT,
          connectionName: application,
          eventData: data,
          eventType: CoreEvents.ON_CACHE_CHANGE,
        },
      });
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

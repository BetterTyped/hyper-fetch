import { useRef } from "react";
import { useDidUpdate } from "@better-typed/react-lifecycle-hooks";
import { ListenerInstance, ExtractListenerDataType } from "@hyper-fetch/sockets";

import { useSocketState } from "helpers";
import { UseListenerOptionsType } from "hooks/use-listener";

export const useListener = <ListenerType extends ListenerInstance>(
  listener: ListenerType,
  { dependencyTracking }: UseListenerOptionsType,
) => {
  const onEventCallback = useRef<
    | null
    | ((
        data: ExtractListenerDataType<ListenerType>,
        event: MessageEvent<ExtractListenerDataType<ListenerType>>,
      ) => void)
  >(null);
  const removeListenerRef = useRef<ReturnType<typeof listener.listen> | null>(null);
  const [state, actions, callbacks, { setRenderKey }] = useSocketState(listener.socket, dependencyTracking);

  const stopListener = () => {
    removeListenerRef.current?.[0]();
  };

  const listen = () => {
    stopListener();
    removeListenerRef.current = listener.listen((data) => {
      actions.setData(data);
      actions.setTimestamp(new Date());
    });
  };

  useDidUpdate(
    () => {
      listen();
    },
    [listener],
    true,
  );

  useDidUpdate(
    () => {
      const unmountListener = listener.socket.events.onListenerEventByName(listener, (event) => {
        onEventCallback.current?.(event.data, event);
        actions.setData(event.data);
        actions.setTimestamp(new Date());
      });
      return unmountListener;
    },
    [listener],
    true,
  );

  const additionalCallbacks = {
    onEvent: (callback: (data: ExtractListenerDataType<ListenerType>) => void) => {
      onEventCallback.current = callback;
    },
  };

  return {
    get data() {
      setRenderKey("data");
      return state.data;
    },
    get connected() {
      setRenderKey("connected");
      return state.connected;
    },
    get connecting() {
      setRenderKey("connecting");
      return state.connecting;
    },
    get timestamp() {
      setRenderKey("timestamp");
      return state.timestamp;
    },
    ...actions,
    ...callbacks,
    ...additionalCallbacks,
    listen,
  };
};

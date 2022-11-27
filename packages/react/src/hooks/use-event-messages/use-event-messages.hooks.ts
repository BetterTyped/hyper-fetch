import { useRef } from "react";
import { useDidUpdate } from "@better-typed/react-lifecycle-hooks";
import { SocketInstance } from "@hyper-fetch/sockets";

import { useSocketState } from "helpers";
import { UseEventMessagesOptionsType } from "hooks/use-event-messages";

/**
 * Allow to listen to all event messages received with sockets
 * @param socket
 * @param options
 * @returns
 */
export const useEventMessages = <ResponsesType>(
  socket: SocketInstance,
  { dependencyTracking = false, filter = [] }: UseEventMessagesOptionsType<ResponsesType>,
) => {
  const onEventCallback = useRef<null | ((data: ResponsesType, event: MessageEvent<ResponsesType>) => void)>(null);
  const [state, actions, callbacks, { setRenderKey }] = useSocketState(socket, dependencyTracking);

  useDidUpdate(
    () => {
      const unmountListener = socket.events.onListenerEvent((event) => {
        const isFiltered = typeof filter === "function" ? filter(event) : filter.includes(event.type);
        if (!isFiltered) {
          onEventCallback.current?.(event.data, event);
          actions.setData(event.data);
          actions.setTimestamp(new Date());
        }
      });
      return unmountListener;
    },
    [socket],
    true,
  );

  const additionalCallbacks = {
    onEvent: (callback: (data: ResponsesType) => void) => {
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
  };
};

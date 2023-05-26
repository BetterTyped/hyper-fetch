import { useRef } from "react";
import { useDidUpdate } from "@better-hooks/lifecycle";
import { SocketInstance } from "@hyper-fetch/sockets";

import { useSocketState } from "helpers";
import { UseEventMessagesOptionsType } from "hooks/use-event-messages";
import { useConfigProvider } from "config-provider";

/**
 * Allow to listen to all event messages received with sockets
 * @param socket
 * @param options
 * @returns
 */
export const useEventMessages = <ResponsesType extends { name: string }>(
  socket: SocketInstance,
  options: UseEventMessagesOptionsType<ResponsesType>,
) => {
  const [globalConfig] = useConfigProvider();
  const { dependencyTracking = false, filter } = { ...globalConfig.useEventMessages, ...options };

  const onEventCallback = useRef<null | ((data: ResponsesType, event: MessageEvent<ResponsesType>) => void)>(null);
  const [state, actions, callbacks, { setRenderKey }] = useSocketState(socket, { dependencyTracking });

  useDidUpdate(
    () => {
      const unmountListener = socket.events.onListenerEvent<ResponsesType>(({ name, data, extra }) => {
        const filterFn = typeof filter === "function" ? () => filter(name, data) : () => filter.includes(name);
        const isFiltered = filter ? filterFn() : false;
        if (!isFiltered) {
          onEventCallback.current?.(data, extra);
          actions.setData(data);
          actions.setTimestamp(+new Date());
        }
      });
      return unmountListener;
    },
    [socket, filter],
    true,
  );

  const additionalCallbacks = {
    onEvent: (callback: NonNullable<typeof onEventCallback.current>) => {
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

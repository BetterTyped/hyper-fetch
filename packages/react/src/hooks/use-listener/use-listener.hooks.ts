import { useRef } from "react";
import { useDidUpdate, useWillUnmount } from "@better-hooks/lifecycle";
import {
  ListenerInstance,
  ExtractListenerAdapterType,
  ExtractSocketExtraType,
  ExtractListenerResponseType,
} from "@hyper-fetch/sockets";

import { useSocketState } from "helpers";
import { UseListenerOptionsType } from "hooks/use-listener";
import { useConfigProvider } from "config-provider";

export const useListener = <ListenerType extends ListenerInstance>(
  listener: ListenerType,
  options: UseListenerOptionsType,
) => {
  const [globalConfig] = useConfigProvider();
  const { dependencyTracking } = { ...globalConfig.useListener, ...options };
  const [state, actions, callbacks, { setRenderKey }] = useSocketState(listener.socket, { dependencyTracking });
  const removeListenerRef = useRef<ReturnType<typeof listener.listen> | null>(null);

  /**
   * Callbacks
   */

  const onEventCallback = useRef<
    | null
    | ((response: {
        data: ExtractListenerResponseType<ListenerType>;
        extra: ExtractSocketExtraType<ExtractListenerAdapterType<ListenerType>>;
      }) => void)
  >(null);

  /**
   * Actions
   */

  const stopListener = () => {
    removeListenerRef.current?.();
  };

  const listen = () => {
    stopListener();
    removeListenerRef.current = listener.listen({
      callback: ({ data, extra }) => {
        onEventCallback.current?.({ data, extra });
        actions.setData(data);
        actions.setTimestamp(+new Date());
      },
    });
  };

  const additionalCallbacks = {
    onEvent: (callback: NonNullable<typeof onEventCallback.current>) => {
      onEventCallback.current = callback;
    },
  };

  /**
   * Lifecycle
   */

  useDidUpdate(
    () => {
      listen();
    },
    [JSON.stringify(listener)],
    true,
  );

  useWillUnmount(() => {
    stopListener();
  });

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

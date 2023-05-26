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

  const onEventCallback = useRef<
    | null
    | ((response: {
        data: ExtractListenerResponseType<ListenerType>;
        extra: ExtractSocketExtraType<ExtractListenerAdapterType<ListenerType>>;
      }) => void)
  >(null);
  const removeListenerRef = useRef<ReturnType<typeof listener.listen> | null>(null);
  const [state, actions, callbacks, { setRenderKey }] = useSocketState(listener.socket, { dependencyTracking });

  const stopListener = () => {
    removeListenerRef.current?.[0]();
  };

  const listen = () => {
    stopListener();
    removeListenerRef.current = listener.listen(({ data, extra }) => {
      onEventCallback.current?.({ data, extra });
      actions.setData(data);
      actions.setTimestamp(+new Date());
    });
  };

  useDidUpdate(
    () => {
      listen();
    },
    [listener],
    true,
  );

  useWillUnmount(() => {
    stopListener();
  });

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
    listen,
  };
};

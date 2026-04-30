import { useDidUpdate, useWillUnmount } from "@better-hooks/lifecycle";
import type { ListenerInstance, ExtractListenerResponseType } from "@hyper-fetch/sockets";
import { useSocketState } from "helpers";
import type { UseListenerOptionsType } from "hooks/use-listener";
import { useProvider } from "provider";
import { useRef } from "react";
import { createTrackedProxy } from "utils";

/** Subscribe to incoming socket messages on a given listener topic with tracked connection state and callbacks. */
export const useListener = <ListenerType extends ListenerInstance>(
  listener: ListenerType,
  options?: UseListenerOptionsType,
) => {
  const { config: globalConfig } = useProvider();
  const { dependencyTracking } = { ...globalConfig.useListener, ...options };
  const [state, actions, callbacks, { setRenderKey }] = useSocketState(listener.socket, { dependencyTracking });
  const removeListenerRef = useRef<ReturnType<typeof listener.listen> | null>(null);

  /**
   * Callbacks
   */

  const onEventCallback = useRef<
    null | ((response: { data: ExtractListenerResponseType<ListenerType>; extra: Record<string, any> }) => void)
  >(null);

  /**
   * Actions
   */

  const stopListener = () => {
    removeListenerRef.current?.();
  };

  const listen = () => {
    stopListener();
    removeListenerRef.current = listener.listen(({ data, extra }) => {
      onEventCallback.current?.({ data, extra });
      actions.setData(data);
      actions.setExtra(extra);
      actions.setTimestamp(Date.now());
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
    [listener.params, JSON.stringify(listener.options)],
    true,
  );

  useWillUnmount(() => {
    stopListener();
  });

  const trackedKeys = ["data", "extra", "connected", "connecting", "timestamp"] as const;

  return createTrackedProxy(
    {
      data: state.data,
      extra: state.extra,
      connected: state.connected,
      connecting: state.connecting,
      timestamp: state.timestamp,
      ...actions,
      ...callbacks,
      ...additionalCallbacks,
      listen,
    },
    trackedKeys,
    setRenderKey,
  );
};

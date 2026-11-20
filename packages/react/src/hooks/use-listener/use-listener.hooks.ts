import { useDidUpdate, useWillUnmount } from "@better-hooks/lifecycle";
import { replaceEqualDeep, stringifyKey } from "@hyper-fetch/core";
import type {
  ExtractListenerDeliveredType,
  ListenerEndType,
  ListenerInstance,
  ListenerLifecycleOptionsType,
  ListenerRequiresPayload,
} from "@hyper-fetch/sockets";
import { getDeliveryKey } from "@hyper-fetch/sockets";
import { useSocketState } from "helpers";
import type { ListenerStatusType, UseListenerOptionsType } from "hooks/use-listener";
import { useProvider } from "provider";
import { useRef } from "react";
import { createTrackedProxy } from "utils";

/** A listener whose subscription payload is required has to get it with `setPayload()` before it is passed */
type ListenerWithPayloadType<ListenerType extends ListenerInstance> =
  ListenerRequiresPayload<ListenerType> extends true
    ? ListenerType & { "Set the payload with setPayload() before passing the listener": never }
    : ListenerType;

/**
 * Subscribe to incoming socket messages on a given listener topic with tracked connection state and callbacks.
 * Changing the topic params, payload, options, delivery or socket of the listener starts a new subscription.
 */
export const useListener = <
  ListenerType extends ListenerInstance,
  TSelected = ExtractListenerDeliveredType<ListenerType>,
>(
  listener: ListenerWithPayloadType<ListenerType>,
  options?: UseListenerOptionsType<ExtractListenerDeliveredType<ListenerType>, TSelected>,
) => {
  const { config: globalConfig } = useProvider();
  const { dependencyTracking = true, structuralSharing = true } = { ...globalConfig.useListener, ...options };
  const select = options?.select;
  const [state, actions, callbacks, { setRenderKey, getState, rerender, setExtendedState }] = useSocketState<
    TSelected,
    ListenerType["socket"],
    { status: ListenerStatusType; error: Error | null }
  >(listener.socket, { dependencyTracking, extendedState: { status: "idle", error: null } });
  const removeListenerRef = useRef<ReturnType<typeof listener.listen> | null>(null);

  /**
   * Selection
   */

  const selectRef = useRef(select);
  selectRef.current = select;
  const appliedSelect = useRef(select);
  // Last message data before applying the selector - allows to re-run it when the selector changes
  const rawData = useRef<{ data: ExtractListenerDeliveredType<ListenerType> } | null>(null);
  const selectError = useRef<{ error: unknown } | null>(null);

  const selectData = (data: ExtractListenerDeliveredType<ListenerType>): TSelected => {
    if (!selectRef.current) {
      return data as unknown as TSelected;
    }
    const selected = selectRef.current(data);
    return structuralSharing ? replaceEqualDeep(getState().data, selected) : selected;
  };

  // Selector failed while processing a message - surface it to the closest error boundary
  if (selectError.current) {
    const { error } = selectError.current;
    selectError.current = null;
    throw error;
  }

  // Selector changed (e.g. it closes over a new prop) - re-run it against the last message
  if (appliedSelect.current !== select) {
    appliedSelect.current = select;
    if (rawData.current) {
      state.data = selectData(rawData.current.data);
    }
  }

  /**
   * Callbacks
   */

  const onEventCallback = useRef<
    null | ((response: { data: ExtractListenerDeliveredType<ListenerType>; extra: Record<string, any> }) => void)
  >(null);
  const onStartCallback = useRef<null | ((data: { topic: string }) => void)>(null);
  const onEndCallback = useRef<null | ((data: ListenerEndType) => void)>(null);

  /**
   * Actions
   */

  const stopListener = () => {
    removeListenerRef.current?.();
  };

  const listen = () => {
    stopListener();
    // Set before subscribing - adapters without confirmation start the subscription synchronously
    setExtendedState({ status: "starting", error: null });
    const lifecycle = {
      onStart: (data: { topic: string }) => {
        setExtendedState({ status: "listening" });
        onStartCallback.current?.(data);
      },
      onEnd: (data: ListenerEndType) => {
        removeListenerRef.current = null;
        setExtendedState({ status: data.error ? "failed" : "ended", error: data.error });
        onEndCallback.current?.(data);
      },
    };
    // The payload is set on the listener, so only the lifecycle callbacks are passed
    const listenWithLifecycle = listener.listen as (
      callback: Parameters<typeof listener.listen>[0],
      options: ListenerLifecycleOptionsType,
    ) => VoidFunction;
    removeListenerRef.current = listenWithLifecycle(({ data, extra }) => {
      onEventCallback.current?.({ data, extra });
      rawData.current = { data };
      appliedSelect.current = selectRef.current;

      let selected: TSelected;
      try {
        selected = selectData(data);
      } catch (error) {
        // Never throw inside of the socket events - rethrow it on render instead
        selectError.current = { error };
        rerender();
        return;
      }

      // With a selector, data is updated only when the selected value changed
      if (!selectRef.current || !Object.is(selected, getState().data)) {
        actions.setData(selected);
      }
      actions.setExtra(extra);
      actions.setTimestamp(Date.now());
    }, lifecycle);
  };

  const additionalCallbacks = {
    onEvent: (callback: NonNullable<typeof onEventCallback.current>) => {
      onEventCallback.current = callback;
    },
    /** The subscription started - with tRPC and oRPC when the server confirmed it, also after a reconnect */
    onStart: (callback: NonNullable<typeof onStartCallback.current>) => {
      onStartCallback.current = callback;
    },
    /** The server ended the subscription, with `error` when it failed */
    onEnd: (callback: NonNullable<typeof onEndCallback.current>) => {
      onEndCallback.current = callback;
    },
  };

  /**
   * Lifecycle
   */

  useDidUpdate(
    () => {
      listen();
    },
    // Topic already contains resolved params. Delivery presets compare by value, custom strategies by identity.
    // The socket is a dependency too - the same topic on another socket is a different subscription, the same
    // goes for the payload - the same procedure with another input is another subscription.
    [
      listener.socket,
      listener.topic,
      stringifyKey(listener.payload),
      JSON.stringify(listener.options),
      getDeliveryKey(listener.delivery),
    ],
    true,
  );

  useWillUnmount(() => {
    stopListener();
  });

  const trackedKeys = ["data", "extra", "connected", "connecting", "timestamp", "status", "error"] as const;

  return createTrackedProxy(
    {
      data: state.data,
      extra: state.extra,
      connected: state.connected,
      connecting: state.connecting,
      timestamp: state.timestamp,
      status: state.status,
      error: state.error,
      ...actions,
      ...callbacks,
      ...additionalCallbacks,
      listen,
    },
    trackedKeys,
    setRenderKey,
  );
};

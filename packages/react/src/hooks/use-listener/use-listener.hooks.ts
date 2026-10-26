import { useDidUpdate, useWillUnmount } from "@better-hooks/lifecycle";
import { replaceEqualDeep } from "@hyper-fetch/core";
import type { ListenerInstance, ExtractListenerDeliveredType } from "@hyper-fetch/sockets";
import { getDeliveryKey } from "@hyper-fetch/sockets";
import { useSocketState } from "helpers";
import type { UseListenerOptionsType } from "hooks/use-listener";
import { useProvider } from "provider";
import { useRef } from "react";
import { createTrackedProxy } from "utils";

/** Subscribe to incoming socket messages on a given listener topic with tracked connection state and callbacks. */
export const useListener = <
  ListenerType extends ListenerInstance,
  TSelected = ExtractListenerDeliveredType<ListenerType>,
>(
  listener: ListenerType,
  options?: UseListenerOptionsType<ExtractListenerDeliveredType<ListenerType>, TSelected>,
) => {
  const { config: globalConfig } = useProvider();
  const { dependencyTracking = true, structuralSharing = true } = { ...globalConfig.useListener, ...options };
  const select = options?.select;
  const [state, actions, callbacks, { setRenderKey, getState, rerender }] = useSocketState<
    TSelected,
    ListenerType["socket"]
  >(listener.socket, { dependencyTracking });
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
    // Topic already contains resolved params. Delivery presets compare by value, custom strategies by identity.
    [listener.topic, JSON.stringify(listener.options), getDeliveryKey(listener.delivery)],
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

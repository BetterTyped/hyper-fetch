import { useRef } from "react";
import { SocketInstance } from "@hyper-fetch/sockets";
import { useDidMount, useDidUpdate, useForceUpdate } from "@better-hooks/lifecycle";

import { UseSocketStateType, initialSocketState, UseSocketStateProps } from "helpers";

export const useSocketState = <DataType>(socket: SocketInstance, { dependencyTracking }: UseSocketStateProps) => {
  const forceUpdate = useForceUpdate();

  const onOpenCallback = useRef<null | VoidFunction>(null);
  const onCloseCallback = useRef<null | VoidFunction>(null);
  const onErrorCallback = useRef<null | ((event: any) => void)>(null);
  const onConnectingCallback = useRef<null | VoidFunction>(null);
  const onReconnectingCallback = useRef<null | ((attempts: number) => void)>(null);
  const onReconnectingStopCallback = useRef<null | ((attempts: number) => void)>(null);

  const state = useRef<UseSocketStateType<DataType>>(initialSocketState);
  const renderKeys = useRef<Array<keyof UseSocketStateType<DataType>>>([]);

  // ******************
  // Dependency Tracking
  // ******************

  const renderKeyTrigger = (keys: Array<keyof UseSocketStateType<DataType>>) => {
    const shouldRerender = renderKeys.current.some((renderKey) => keys.includes(renderKey));
    if (shouldRerender) forceUpdate();
  };

  const setRenderKey = (renderKey: keyof UseSocketStateType<DataType>) => {
    if (!renderKeys.current.includes(renderKey)) {
      renderKeys.current.push(renderKey);
    }
  };

  // ******************
  // Turn off dependency tracking
  // ******************

  useDidUpdate(
    () => {
      const handleDependencyTracking = () => {
        if (!dependencyTracking) {
          Object.keys(state.current).forEach((key) => setRenderKey(key as Parameters<typeof setRenderKey>[0]));
        }
      };

      handleDependencyTracking();
    },
    [dependencyTracking],
    true,
  );

  // ******************
  // Actions
  // ******************

  const actions = {
    setData: (data: DataType | null) => {
      state.current.data = data;
      renderKeyTrigger(["data"]);
    },
    setConnected: (connected: boolean) => {
      state.current.connected = connected;
      renderKeyTrigger(["data"]);
    },
    setConnecting: (connecting: boolean) => {
      state.current.connecting = connecting;
      renderKeyTrigger(["data"]);
    },
    setTimestamp: (timestamp: number | null) => {
      state.current.timestamp = timestamp;
      renderKeyTrigger(["timestamp"]);
    },
  };

  const callbacks = {
    onOpen: (callback: VoidFunction) => {
      onOpenCallback.current = callback;
    },
    onClose: (callback: VoidFunction) => {
      onCloseCallback.current = callback;
    },
    onError: <ErrorType = Event>(callback: (event: ErrorType) => void) => {
      onErrorCallback.current = callback;
    },
    onConnecting: (callback: VoidFunction) => {
      onConnectingCallback.current = callback;
    },
    onReconnecting: (callback: (attempts: number) => void) => {
      onReconnectingCallback.current = callback;
    },
    onReconnectingStop: (callback: (attempts: number) => void) => {
      onReconnectingStopCallback.current = callback;
    },
  };

  // ******************
  // Hook to events
  // ******************

  useDidMount(() => {
    const umountOnError = socket.events.onError((event) => {
      onErrorCallback.current?.(event);
    });
    const umountOnConnecting = socket.events.onConnecting(() => {
      actions.setConnecting(true);
      onConnectingCallback.current?.();
    });
    const umountOnOpen = socket.events.onOpen(() => {
      actions.setConnected(true);
      onOpenCallback.current?.();
    });
    const umountOnClose = socket.events.onClose(() => {
      actions.setConnected(false);
      onCloseCallback.current?.();
    });
    const umountOnReconnecting = socket.events.onReconnecting((attempts) => {
      onReconnectingCallback.current?.(attempts);
    });
    const umountOnReconnectingStop = socket.events.onReconnectingStop((attempts) => {
      onReconnectingStopCallback.current?.(attempts);
    });

    return () => {
      umountOnError();
      umountOnConnecting();
      umountOnOpen();
      umountOnClose();
      umountOnReconnecting();
      umountOnReconnectingStop();
    };
  });

  return [state.current, actions, callbacks, { setRenderKey }] as const;
};

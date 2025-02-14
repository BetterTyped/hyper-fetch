import { useRef } from "react";
import { SocketInstance, ExtractSocketExtraType } from "@hyper-fetch/sockets";
import { useDidMount, useDidUpdate, useForceUpdate } from "@better-hooks/lifecycle";

import { UseSocketStateType, initialSocketState, UseSocketStateProps } from "helpers";

export const useSocketState = <DataType, Socket extends SocketInstance>(
  socket: Socket,
  { dependencyTracking }: UseSocketStateProps,
) => {
  const forceUpdate = useForceUpdate();

  const onDisconnectCallback = useRef<null | VoidFunction>(null);
  const onErrorCallback = useRef<null | ((event: any) => void)>(null);
  const onConnectedCallback = useRef<null | VoidFunction>(null);
  const onConnectingCallback = useRef<null | VoidFunction>(null);
  const onReconnectingCallback = useRef<null | ((attempts: number) => void)>(null);
  const onReconnectingFailedCallback = useRef<null | ((attempts: number) => void)>(null);

  const state = useRef<UseSocketStateType<Socket, DataType>>(initialSocketState);
  const renderKeys = useRef<Array<keyof UseSocketStateType<Socket, DataType>>>([]);

  // ******************
  // Dependency Tracking
  // ******************

  const renderKeyTrigger = (keys: Array<keyof UseSocketStateType<Socket, DataType>>) => {
    const shouldRerender = renderKeys.current.some((renderKey) => keys.includes(renderKey));
    if (shouldRerender) forceUpdate();
  };

  const setRenderKey = (renderKey: keyof UseSocketStateType<Socket, DataType>) => {
    if (!renderKeys.current.includes(renderKey)) {
      renderKeys.current.push(renderKey);
    }
  };

  // ******************
  // Turn off dependency tracking
  // ******************

  useDidUpdate(
    () => {
      state.current.connected = socket.adapter.state.connected;
      state.current.connecting = socket.adapter.state.connecting;

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
    setExtra: (extra: ExtractSocketExtraType<Socket> | null) => {
      state.current.extra = extra;
      renderKeyTrigger(["extra"]);
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
    onConnected: (callback: VoidFunction) => {
      onConnectedCallback.current = callback;
    },
    onDisconnected: (callback: VoidFunction) => {
      onDisconnectCallback.current = callback;
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
    onReconnectingFailed: (callback: (attempts: number) => void) => {
      onReconnectingFailedCallback.current = callback;
    },
  };

  // ******************
  // Hook to events
  // ******************

  useDidMount(() => {
    const umountOnError = socket.events.onError((event) => {
      onErrorCallback.current?.(event);
    });
    const umountOnConnecting = socket.events.onConnecting((connecting) => {
      actions.setConnecting(connecting);
      onConnectingCallback.current?.();
    });
    const umountOnOpen = socket.events.onConnected(() => {
      actions.setConnected(true);
      onConnectedCallback.current?.();
    });
    const umountOnClose = socket.events.onDisconnected(() => {
      actions.setConnected(false);
      onDisconnectCallback.current?.();
    });
    const umountOnReconnecting = socket.events.onReconnecting((attempts) => {
      onReconnectingCallback.current?.(attempts);
    });
    const umountOnReconnectingFailed = socket.events.onReconnectingFailed((attempts) => {
      onReconnectingFailedCallback.current?.(attempts);
    });

    return () => {
      umountOnError();
      umountOnConnecting();
      umountOnOpen();
      umountOnClose();
      umountOnReconnecting();
      umountOnReconnectingFailed();
    };
  });

  return [state.current, actions, callbacks, { setRenderKey }] as const;
};

import { useDidUpdate } from "@better-hooks/lifecycle";
import type { SocketInstance, ExtractSocketExtraType } from "@hyper-fetch/sockets";
import type { UseSocketStateType, UseSocketStateProps } from "helpers";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

/**
 * Tracked socket state shared by the socket hooks. `extendedState` adds hook-specific fields (e.g. the listener
 * status) that are tracked the same way and changed with `actions.setExtendedState`.
 */
export const useSocketState = <
  DataType,
  Socket extends SocketInstance,
  ExtendedState extends Record<string, unknown> = Record<never, never>,
>(
  socket: Socket,
  { dependencyTracking, extendedState }: UseSocketStateProps & { extendedState?: ExtendedState },
) => {
  type StateType = UseSocketStateType<Socket, DataType> & ExtendedState;
  const initialExtendedState = useRef(extendedState);
  const onDisconnectCallback = useRef<null | VoidFunction>(null);
  const onErrorCallback = useRef<null | ((event: any) => void)>(null);
  const onConnectedCallback = useRef<null | VoidFunction>(null);
  const onConnectingCallback = useRef<null | VoidFunction>(null);
  const onReconnectingCallback = useRef<null | ((data: { attempts: number }) => void)>(null);
  const onReconnectingFailedCallback = useRef<null | ((data: { attempts: number }) => void)>(null);

  const state = useRef<StateType>({
    ...initialExtendedState.current,
    data: null,
    extra: null,
    connected: socket.adapter.connected,
    connecting: socket.adapter.connecting,
    timestamp: null,
  } as StateType);
  const renderKeys = useRef<(keyof StateType)[]>([]);

  // ******************
  // useSyncExternalStore
  // ******************

  const versionRef = useRef(0);
  const listenerRef = useRef<(() => void) | null>(null);

  const subscribe = useCallback((listener: () => void) => {
    listenerRef.current = listener;
    return () => {
      listenerRef.current = null;
    };
  }, []);

  const getSnapshot = useCallback(() => versionRef.current, []);

  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const emitChange = () => {
    versionRef.current += 1;
    listenerRef.current?.();
  };

  // ******************
  // Dependency Tracking
  // ******************

  const renderKeyTrigger = (keys: (keyof StateType)[]) => {
    const shouldRerender = renderKeys.current.some((renderKey) => keys.includes(renderKey));
    if (shouldRerender) {
      emitChange();
    }
  };

  const setRenderKey = (renderKey: keyof StateType) => {
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
    setExtra: (extra: ExtractSocketExtraType<Socket> | null) => {
      state.current.extra = extra;
      renderKeyTrigger(["extra"]);
    },
    setConnected: (connected: boolean) => {
      state.current.connected = connected;
      renderKeyTrigger(["connected"]);
    },
    setConnecting: (connecting: boolean) => {
      state.current.connecting = connecting;
      renderKeyTrigger(["connecting"]);
    },
    setTimestamp: (timestamp: number | null) => {
      state.current.timestamp = timestamp;
      renderKeyTrigger(["timestamp"]);
    },
    clearState: () => {
      state.current = {
        ...initialExtendedState.current,
        data: null,
        extra: null,
        connected: false,
        connecting: false,
        timestamp: null,
      } as StateType;
      renderKeyTrigger(Object.keys(state.current) as (keyof StateType)[]);
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
    onReconnecting: (callback: (data: { attempts: number }) => void) => {
      onReconnectingCallback.current = callback;
    },
    onReconnectingFailed: (callback: (data: { attempts: number }) => void) => {
      onReconnectingFailedCallback.current = callback;
    },
  };

  // ******************
  // Hook to events
  // ******************

  // Plain effect on purpose - StrictMode runs mount, cleanup and mount again,
  // so a mount-once guard would leave the hook without any subscriptions
  useEffect(() => {
    // Catch up with anything that happened between the render and the subscription
    if (state.current.connected !== socket.adapter.connected) {
      actions.setConnected(socket.adapter.connected);
    }
    if (state.current.connecting !== socket.adapter.connecting) {
      actions.setConnecting(socket.adapter.connecting);
    }

    const umountOnError = socket.events.onError((event) => {
      onErrorCallback.current?.(event);
    });
    const umountOnConnecting = socket.events.onConnecting(({ connecting }) => {
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
    const umountOnReconnecting = socket.events.onReconnecting(({ attempts }) => {
      onReconnectingCallback.current?.({ attempts });
    });
    const umountOnReconnectingFailed = socket.events.onReconnectingFailed(({ attempts }) => {
      onReconnectingFailedCallback.current?.({ attempts });
    });

    return () => {
      umountOnError();
      umountOnConnecting();
      umountOnOpen();
      umountOnClose();
      umountOnReconnecting();
      umountOnReconnectingFailed();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const getState = () => state.current;

  /** Changes the hook-specific fields added with `extendedState` */
  const setExtendedState = (newState: Partial<ExtendedState>) => {
    Object.assign(state.current, newState);
    renderKeyTrigger(Object.keys(newState) as (keyof StateType)[]);
  };

  return [
    state.current,
    actions,
    callbacks,
    { setRenderKey, getState, rerender: emitChange, setExtendedState },
  ] as const;
};

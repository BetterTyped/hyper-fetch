import { useRef } from "react";
import { useForceUpdate } from "@better-typed/react-lifecycle-hooks";

import { UseSocketStateType, initialSocketState } from "helpers";

export const useSocketState = <DataType>() => {
  const forceUpdate = useForceUpdate();

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

  // useDidUpdate(
  //   () => {
  //     const handleDependencyTracking = () => {
  //       if (!dependencyTracking) {
  //         Object.keys(state.current).forEach((key) => setRenderKey(key as Parameters<typeof setRenderKey>[0]));
  //       }
  //     };

  //     handleDependencyTracking();
  //   },
  //   [dependencyTracking],
  //   true,
  // );

  // ******************
  // Cache data handler
  // ******************

  // const handleCompare = (firstValue: unknown, secondValue: unknown) => {
  //   if (typeof deepCompare === "function") {
  //     return deepCompare(firstValue, secondValue);
  //   }
  //   if (deepCompare) {
  //     return isEqual(firstValue, secondValue);
  //   }
  //   return false;
  // };

  // ******************
  // Actions
  // ******************

  const actions = {
    setData: (data: DataType | null) => {
      state.current.data = data;
      renderKeyTrigger(["data"]);
    },
    setEmitting: (emitting: boolean) => {
      state.current.emitting = emitting;
      renderKeyTrigger(["data"]);
    },
    setListening: (listening: boolean) => {
      state.current.listening = listening;
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
    setTimestamp: (timestamp: Date | null) => {
      state.current.timestamp = timestamp;
      renderKeyTrigger(["timestamp"]);
    },
  };

  return [state.current, actions, { setRenderKey }] as const;
};

import { useRef } from "react";
import { EmitterInstance } from "@hyper-fetch/sockets";

import { UseEmitterOptionsType } from "hooks/use-emitter";
import { useSocketState } from "helpers";
import { useConfigProvider } from "config-provider";

// Todo bounce

export const useEmitter = <EmitterType extends EmitterInstance>(
  emitter: EmitterType,
  options: UseEmitterOptionsType,
) => {
  const [globalConfig] = useConfigProvider();
  const { dependencyTracking } = { ...globalConfig.useEmitter, ...options };

  const onEventCallback = useRef<null | ((emitter: EmitterType) => void)>(null);
  const [state, actions, callbacks, { setRenderKey }] = useSocketState(emitter.socket, { dependencyTracking });

  const additionalCallbacks = {
    onEvent: (callback: (emitter: EmitterType) => void) => {
      onEventCallback.current = callback;
    },
  };

  const emit: typeof emitter.emit = (...args) => {
    actions.setTimestamp(+new Date());
    onEventCallback.current?.(emitter);
    return emitter.emit(...args);
  };

  return {
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
    emit,
    reconnect: emitter.socket.reconnect,
  };
};

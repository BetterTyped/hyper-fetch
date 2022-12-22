import { useRef } from "react";
import { EmitterInstance } from "@hyper-fetch/sockets";

import { UseEmitterOptionsType } from "hooks/use-emitter";
import { useSocketState } from "helpers";

// Todo bounce

export const useEmitter = <EmitterType extends EmitterInstance>(
  emitter: EmitterType,
  { dependencyTracking }: UseEmitterOptionsType,
) => {
  const onEmitCallback = useRef<null | ((emitter: EmitterType) => void)>(null);
  const [state, actions, callbacks, { setRenderKey }] = useSocketState(emitter.socket, dependencyTracking);

  const emit: typeof emitter.emit = (...args) => {
    actions.setTimestamp(+new Date());
    return emitter.emit(...args);
  };

  const additionalCallbacks = {
    onEmit: (callback: (emitter: EmitterType) => void) => {
      onEmitCallback.current = callback;
    },
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

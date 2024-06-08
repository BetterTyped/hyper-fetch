import { useRef } from "react";
import { EmitterInstance, EmitterCallbackErrorType } from "@hyper-fetch/sockets";
import { useDidUpdate } from "@better-hooks/lifecycle";

import { UseEmitterOptionsType } from "hooks/use-emitter";
import { useSocketState } from "helpers";
import { useProvider } from "provider";

export const useEmitter = <EmitterType extends EmitterInstance>(
  emitter: EmitterType,
  options?: UseEmitterOptionsType,
) => {
  const { config: globalConfig } = useProvider();
  const { dependencyTracking } = { ...globalConfig.useEmitter, ...options };

  const [state, actions, callbacks, { setRenderKey }] = useSocketState(emitter.socket, { dependencyTracking });

  /**
   * Callbacks
   */
  const onEventStartCallback = useRef<null | ((emitter: EmitterType) => void)>(null);
  const onEventErrorCallback = useRef<null | EmitterCallbackErrorType<EmitterType>>(null);

  useDidUpdate(
    () => {
      const onEventStart = () => {
        return emitter.socket.events.onEmitterStartEventByTopic(emitter, () => {
          onEventStartCallback.current?.(emitter);
        });
      };

      const onEventError = () => {
        return emitter.socket.events.onEmitterErrorByTopic(emitter, (error, emitterInstance) => {
          onEventErrorCallback.current?.(error, emitterInstance);
        });
      };

      const unmountEventStart = onEventStart();
      const unmountEventError = onEventError();

      return () => {
        unmountEventStart();
        unmountEventError();
      };
    },
    [emitter.topic],
    true,
  );

  /**
   * Emitter
   */

  const emit: typeof emitter.emit = (emitOptions) => {
    return emitter.emit(emitOptions);
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
    ...actions,
    ...callbacks,
    onEmitStart: (callback: (emitter: EmitterType) => void) => {
      onEventStartCallback.current = callback;
    },
    onEmitError: (callback: EmitterCallbackErrorType<EmitterType>) => {
      onEventErrorCallback.current = callback;
    },
    emit,
    reconnect: emitter.socket.reconnect,
  };
};

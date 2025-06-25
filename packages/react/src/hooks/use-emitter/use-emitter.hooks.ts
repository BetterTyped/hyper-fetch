import { EmitterInstance, EmitterCallbackErrorType, EmitType } from "@hyper-fetch/sockets";
import { useDidUpdate } from "@better-hooks/lifecycle";
import { useRef } from "react";

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
  const onEventErrorCallback = useRef<null | EmitterCallbackErrorType>(null);

  useDidUpdate(
    () => {
      const onEventStart = () => {
        return emitter.socket.events.onEmitterStartEventByTopic(emitter, () => {
          onEventStartCallback.current?.(emitter);
        });
      };

      const onEventError = () => {
        return emitter.socket.events.onEmitterErrorByTopic(emitter, ({ error }) => {
          onEventErrorCallback.current?.({ error });
        });
      };

      const unmountEventStart = onEventStart();
      const unmountEventError = onEventError();

      return () => {
        unmountEventStart();
        unmountEventError();
      };
    },
    [emitter.topic, onEventStartCallback.current, onEventErrorCallback.current],
    true,
  );

  /**
   * Emitter
   */

  const emit: EmitType<EmitterType> = (emitOptions: Parameters<EmitType<EmitterType>>[0]) => {
    return emitter.emit(emitOptions as any);
  };

  const onEmit = (callback: (emitter: EmitterType) => void) => {
    onEventStartCallback.current = callback;
  };

  const onEmitError = (callback: EmitterCallbackErrorType) => {
    onEventErrorCallback.current = callback;
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
    onEmit,
    onEmitError,
    emit,
  };
};

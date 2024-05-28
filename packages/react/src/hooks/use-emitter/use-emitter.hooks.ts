import { useRef } from "react";
import { EmitterCallbackResponseType, EmitterInstance, EmitterCallbackErrorType } from "@hyper-fetch/sockets";

import { UseEmitterOptionsType } from "hooks/use-emitter";
import { useSocketState } from "helpers";
import { useConfigProvider } from "config-provider";
import { useDidUpdate } from "@better-hooks/lifecycle";

export const useEmitter = <EmitterType extends EmitterInstance>(
  emitter: EmitterType,
  options?: UseEmitterOptionsType,
) => {
  const { config: globalConfig } = useConfigProvider();
  const { dependencyTracking } = { ...globalConfig.useEmitter, ...options };

  const [state, actions, callbacks, { setRenderKey }] = useSocketState(emitter.socket, { dependencyTracking });

  /**
   * Callbacks
   */
  const onEventStartCallback = useRef<null | ((emitter: EmitterType) => void)>(null);
  const onEventCallback = useRef<null | EmitterCallbackResponseType<EmitterType>>(null);
  const onEventErrorCallback = useRef<null | EmitterCallbackErrorType<EmitterType>>(null);

  useDidUpdate(
    () => {
      const onEventStart = () => {
        return emitter.socket.events.onEmitterStartEventByTopic(emitter, () => {
          onEventStartCallback.current?.(emitter);
        });
      };
      const onEvent = () => {
        return emitter.socket.events.onEmitterEventByTopic(emitter, (response, emitter) => {
          onEventCallback.current?.(response, emitter);
          actions.setData(response.data);
          actions.setExtra(response.extra);
        });
      };

      const onEventError = () => {
        return emitter.socket.events.onEmitterErrorByTopic(emitter, (error, emitter) => {
          onEventErrorCallback.current?.(error, emitter);
        });
      };

      const unmountEvent = onEvent();
      const unmountEventStart = onEventStart();
      const unmountEventError = onEventError();

      return () => {
        unmountEvent();
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
    get timestamp() {
      setRenderKey("timestamp");
      return state.timestamp;
    },
    ...actions,
    ...callbacks,
    onEmitEventStart: (callback: (emitter: EmitterType) => void) => {
      onEventStartCallback.current = callback;
    },
    onEmitEvent: (callback: EmitterCallbackResponseType<EmitterType>) => {
      onEventCallback.current = callback;
    },
    onEmitError: (callback: EmitterCallbackErrorType<EmitterType>) => {
      onEventErrorCallback.current = callback;
    },
    emit,
    reconnect: emitter.socket.reconnect,
  };
};

/* eslint-disable @typescript-eslint/no-use-before-define */
import { EmitterEmitOptionsType, EmitterInstance } from "./emitter.types";

export const emitEvent = <Emitter extends EmitterInstance>(
  emitter: Emitter,
  options: Partial<EmitterEmitOptionsType<Emitter>> = {},
) => {
  const { onEvent, onEventStart, onEventError } = options;

  let isResolved = false;

  const unmountStart =
    onEventStart &&
    emitter.socket.events.onEmitterStartEventByTopic(emitter, () => {
      if (isResolved) return;

      onEventStart(emitter);
    });

  const unmountResponse = emitter.socket.events.onEmitterEventByTopic(emitter, (response, emitterInstance) => {
    if (isResolved) return;

    isResolved = true;
    onEvent(response, emitterInstance);
    umountAll();
  });

  const unmountError =
    onEventError &&
    emitter.socket.events.onEmitterErrorByTopic(emitter, (error, emitterInstance) => {
      if (isResolved) return;

      isResolved = true;
      onEventError(error, emitterInstance);
      umountAll();
    });

  emitter.socket.adapter.emit(emitter);

  function umountAll() {
    unmountStart?.();
    unmountResponse?.();
    unmountError?.();
  }

  return umountAll;
};

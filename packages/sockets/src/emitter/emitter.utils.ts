import { EmitterEmitOptionsType, EmitterInstance } from "./emitter.types";
import { getUniqueRequestId } from "@hyper-fetch/core";

export const emitEvent = <Emitter extends EmitterInstance>(
  emitter: Emitter,
  options: Partial<EmitterEmitOptionsType<Emitter>> = {},
) => {
  const { onEvent, onEventStart, onEventError } = options;

  let isResolved = false;
  const eventMessageId = getUniqueRequestId(emitter.topic);

  const unmountStart =
    onEventStart &&
    emitter.socket.events.onEmitterStartEventByTopic(emitter, () => {
      if (isResolved) return;

      onEventStart(emitter);
    });

  const unmountResponse = emitter.socket.events.onEmitterEventByTopic(emitter, (response, emitter) => {
    if (isResolved) return;

    isResolved = true;
    onEvent(response, emitter);
    umountAll();
  });

  const unmountError =
    onEventError &&
    emitter.socket.events.onEmitterErrorByTopic(emitter, (error, emitter) => {
      if (isResolved) return;

      isResolved = true;
      onEventError(error, emitter);
      umountAll();
    });

  emitter.socket.adapter.emit(eventMessageId, emitter);

  function umountAll() {
    unmountStart?.();
    unmountResponse?.();
    unmountError?.();
  }

  return umountAll;
};

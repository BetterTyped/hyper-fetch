import { EmitterInstance } from "./emitter.types";

export const emitEvent = <Emitter extends EmitterInstance>(emitter: Emitter) => {
  const payload = emitter.payloadMapper ? emitter.payloadMapper(emitter.payload) : emitter.payload;

  emitter.socket.adapter.emit(emitter, payload);
};

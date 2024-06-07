import { EmitterInstance } from "./emitter.types";

export const emitEvent = <Emitter extends EmitterInstance>(emitter: Emitter) => {
  const data = emitter.dataMapper ? emitter.dataMapper(emitter.data) : emitter.data;

  emitter.socket.adapter.emit(emitter, data);
};

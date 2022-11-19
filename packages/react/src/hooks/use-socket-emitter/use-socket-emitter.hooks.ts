import { EmitterInstance } from "@hyper-fetch/sockets";

import { useSocketState } from "helpers";

export const useSocketEmitter = <EmitterType extends EmitterInstance>(emitter: EmitterType) => {
  const [state, actions, { setRenderKey }] = useSocketState();

  const emit = () => {
    emitter.emit();
  };

  return {
    get data() {
      setRenderKey("data");
      return state.data;
    },
    ...actions,
    emit,
  };
};

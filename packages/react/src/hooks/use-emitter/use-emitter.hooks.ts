import { EmitterInstance } from "@hyper-fetch/sockets";

import { useSocketState } from "helpers";

export const useEmitter = <EmitterType extends EmitterInstance>(emitter: EmitterType) => {
  const [state, actions, { setRenderKey }] = useSocketState();

  return {
    get data() {
      setRenderKey("data");
      return state.data;
    },
    ...actions,
    emit: emitter.emit, // Handle rest params
  };
};

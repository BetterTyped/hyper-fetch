import { useRef } from "react";
import { useDidMount } from "@better-typed/react-lifecycle-hooks";
import { ListenerInstance } from "@hyper-fetch/sockets";

import { useSocketState } from "helpers";

export const useListener = <ListenerType extends ListenerInstance>(listener: ListenerType) => {
  const removeListenerRef = useRef<ReturnType<typeof listener.listen> | null>(null);
  const [state, actions, { setRenderKey }] = useSocketState();

  const stopListener = () => {
    removeListenerRef.current?.[0]();
  };

  const listen = () => {
    stopListener();
    removeListenerRef.current = listener.listen(() => {
      console.error(1);
    });
  };

  useDidMount(() => {
    listen();
  });

  return {
    get data() {
      setRenderKey("data");
      return state.data;
    },
    ...actions,
    listen,
  };
};

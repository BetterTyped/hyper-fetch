import { renderHook } from "@testing-library/react";
import { ListenerInstance } from "@hyper-fetch/sockets";

import { useListener, UseListenerOptionsType } from "hooks/use-listener";

export const renderUseListener = <T extends ListenerInstance>(listener: T, options?: UseListenerOptionsType) => {
  return renderHook((rerenderOptions: UseListenerOptionsType & { listener?: ListenerInstance }) => {
    const { listener: lst, ...rest } = rerenderOptions || {};
    return useListener(lst || listener, { dependencyTracking: false, ...options, ...rest });
  });
};

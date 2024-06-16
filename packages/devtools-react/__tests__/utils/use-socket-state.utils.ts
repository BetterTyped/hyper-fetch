import { SocketInstance } from "@hyper-fetch/sockets";
import { renderHook } from "@testing-library/react";

import { useSocketState, UseSocketStateProps } from "helpers";

export const renderUseSocketState = <SocketType extends SocketInstance>(
  socket: SocketType,
  options?: Partial<UseSocketStateProps>,
) => {
  return renderHook(() => {
    return useSocketState(socket, { dependencyTracking: false, ...options });
  });
};

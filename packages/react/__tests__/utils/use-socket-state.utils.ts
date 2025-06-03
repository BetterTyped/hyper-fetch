import { Socket } from "@hyper-fetch/sockets";
import { renderHook } from "@testing-library/react";

import { useSocketState } from "helpers";

export const renderUseSocketState = (socket: Socket, { onRender }: { onRender?: jest.Mock } = {}) => {
  return renderHook(() => {
    onRender?.();
    return useSocketState(socket, { dependencyTracking: true });
  });
};

import type { Socket } from "@hyper-fetch/sockets";
import { renderHook } from "@testing-library/react";
import { useSocketState } from "helpers";
import type { Mock } from "vitest";

export const renderUseSocketState = (socket: Socket, { onRender }: { onRender?: Mock } = {}) => {
  return renderHook(() => {
    onRender?.();
    return useSocketState(socket, { dependencyTracking: true });
  });
};

import { Time } from "@hyper-fetch/core";
import { SocketInstance } from "@hyper-fetch/sockets";

export * from "./http";
export * from "./graphql";
export * from "./sse";
export * from "./websockets";
export * from "./types";

export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

/**
 * Wait for connection to socket
 * Helpful in testing
 * @param timeout
 * @returns
 */
export const waitForConnection = async (socket: SocketInstance, timeout = Time.SEC * 4): Promise<true> => {
  const connected = await new Promise<boolean>((resolve) => {
    if (socket.adapter.connected) {
      resolve(true);
      return;
    }
    let id: NodeJS.Timeout;

    const unmount = socket.events.onConnected(() => {
      unmount();
      resolve(true);
      clearTimeout(id);
    });

    id = setTimeout(() => {
      unmount();
      resolve(false);
    }, timeout);
  });

  if (!connected) {
    throw new Error("[waitForConnection] Connection timeout");
  }

  return connected;
};

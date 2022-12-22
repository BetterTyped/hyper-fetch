import WS from "jest-websocket-mock";

import { ListenerInstance } from "listener";
import { ExtractListenerResponseType } from "types";

export const wsUrl = "ws://localhost:1234";
let wsServer = new WS(wsUrl);

export const resetWsServer = () => {
  if (wsServer) {
    wsServer.close();
    WS.clean();
  }
};

export const createWsServer = (options?: ConstructorParameters<typeof WS>[1] & { url?: string }) => {
  const { url = wsUrl, ...wsOptions } = options || {};
  if (wsServer) {
    resetWsServer();
  }
  wsServer = new WS(url, wsOptions);
  return wsServer;
};

export const sendWsEvent = <T extends ListenerInstance>(
  listener: T,
  event: ExtractListenerResponseType<T> extends Record<string, any>
    ? ExtractListenerResponseType<T>
    : Record<string, any>,
) => {
  wsServer.send(
    JSON.stringify({
      ...event,
      name: listener.name,
    }),
  );
};

export const constructEventData = <T extends Record<string, any>>({ name }: { name: string }, message: T) => {
  return {
    ...message,
    name,
  };
};

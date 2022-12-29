import WS from "jest-websocket-mock";
import { ListenerInstance, ExtractListenerResponseType } from "@hyper-fetch/sockets";

import { socket } from "../utils/socket.utils";

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
  socket.adapter.reconnect();
  return wsServer;
};

export const constructEventData = <T extends Record<string, any>>({ name }: { name: string }, data: T) => {
  return {
    data,
    name,
  };
};

export const sendWsEvent = <T extends ListenerInstance>(
  listener: T,
  event: ExtractListenerResponseType<T> extends Record<string, any>
    ? ExtractListenerResponseType<T>
    : Record<string, any>,
) => {
  const data = constructEventData(listener, event);

  wsServer.send(JSON.stringify(data));
};

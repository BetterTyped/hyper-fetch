import { ExtractListenerResponseType, ListenerInstance } from "@hyper-fetch/sockets";
import WS from "jest-websocket-mock";

export const wsUrl = "ws://localhost:1234";
export const wsServer = new WS(wsUrl);

export const sendWsEvent = <T extends ListenerInstance>(
  listener: T,
  event: ExtractListenerResponseType<T> extends Record<string, any>
    ? ExtractListenerResponseType<T>
    : Record<string, any>,
) => {
  wsServer.send(
    JSON.stringify({
      ...event,
      type: listener.name,
    }),
  );
};

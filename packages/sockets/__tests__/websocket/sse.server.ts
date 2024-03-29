import { sources } from "eventsourcemock";

import { ListenerInstance } from "listener";
import { ExtractListenerResponseType } from "types";
import { constructEventData, wsUrl } from "./websocket.server";

export const sendSseEvent = <T extends ListenerInstance>(
  listener: T,
  event: ExtractListenerResponseType<T> extends Record<string, any>
    ? ExtractListenerResponseType<T>
    : Record<string, any>,
) => {
  const data = constructEventData(listener, event);
  sources[wsUrl].emitMessage(new MessageEvent(listener.endpoint, { data: JSON.stringify(data) }));
};

export const openSse = () => {
  sources[wsUrl].emitOpen();
};

export const closeSse = () => {
  sources[wsUrl].close();
};

export const emitError = () => {
  sources[wsUrl].emitError(new Error("Test error"));
};

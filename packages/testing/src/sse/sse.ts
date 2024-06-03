import { sources } from "eventsourcemock";
import { WS } from "jest-websocket-mock";
import {
  ListenerInstance,
  ExtractListenerResponseType,
  ExtendListener,
  ExtractListenerTopicType,
} from "@hyper-fetch/sockets";
import { ExtractRouteParams, NegativeTypes } from "@hyper-fetch/core";

const constructEventData = <T extends Record<string, any>>({ topic }: { topic: string }, data: T) => {
  return {
    data,
    topic,
  };
};

export const createSseMockingServer = () => {
  const url = "ws://localhost:1234";

  let server = new WS(url);

  const startServer = (): void => {
    server = new WS(url);
  };

  const resetMocks = () => {
    server.close();
    WS.clean();
  };

  const stopServer = (): void => {
    server.close();
  };

  const emitError = () => {
    sources[url].emitError(new Error("Test error"));
  };

  const emitOpen = () => {
    sources[url].emitOpen();
  };

  const getSource = () => {
    return sources[url];
  };

  const emitListenerEvent = <T extends ListenerInstance>(
    listener: ExtendListener<
      T,
      { hasParams: ExtractRouteParams<ExtractListenerTopicType<T>> extends NegativeTypes ? false : true }
    >,
    event: ExtractListenerResponseType<T> extends Record<string, any>
      ? ExtractListenerResponseType<T>
      : Record<string, any>,
  ) => {
    const data = constructEventData(listener, event);
    sources[url].emitMessage(new MessageEvent(listener.topic, { data: JSON.stringify(data) }));
  };

  return {
    server,
    url,
    startServer,
    resetMocks,
    stopServer,
    getSource,
    emitError,
    emitOpen,
    emitListenerEvent,
  };
};

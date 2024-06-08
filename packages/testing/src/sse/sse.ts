import { sources } from "eventsourcemock";
import { WS } from "jest-websocket-mock";
import {
  ListenerInstance,
  ExtractListenerResponseType,
  ExtendListener,
  ExtractListenerTopicType,
} from "@hyper-fetch/sockets";
import { ExtractRouteParams, NegativeTypes } from "@hyper-fetch/core/src";

const constructEventData = <T extends Record<string, any>>({ topic }: { topic: string }, data: T) => {
  return {
    data,
    topic,
  };
};

export const createSseMockingServer = () => {
  const url = "ws://localhost:1234";
  const server = { current: new WS(url) };

  const getServer = () => {
    return server.current;
  };

  const startServer = () => {
    sources[url]?.close();
    getServer().close();
    server.current = new WS(url);
  };

  const waitForConnection = async () => {
    const connected = await getServer().connected;

    sources[url].emitOpen();

    return connected;
  };

  const stopServer = (): void => {
    sources[url].close();
    getServer().close();
    WS.clean();
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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
    url,
    getServer,
    startServer,
    waitForConnection,
    stopServer,
    getSource,
    emitError,
    emitOpen,
    emitListenerEvent,
  };
};

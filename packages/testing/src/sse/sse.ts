import { sources } from "eventsourcemock";
import { WS } from "jest-websocket-mock";
import {
  ListenerInstance,
  ExtractListenerResponseType,
  ExtendListener,
  ExtractListenerTopicType,
} from "@hyper-fetch/sockets";
import type { ExtractRouteParams, NegativeTypes } from "@hyper-fetch/core/src";

const constructEventData = <T extends Record<string, any>>({ topic }: { topic: string }, data: T) => {
  return {
    topic,
    data,
  };
};

export const createSseMockingServer = (url = "ws://localhost:1234") => {
  const getServer = () => {
    return sources[url];
  };

  /**
   * This method starts the connection with sse server
   * Has to be invoked BEFORE creating a socket in tests
   */
  const startServer = async () => {
    sources[url].emitOpen();
  };

  const stopServer = (): void => {
    sources[url].close();
    WS.clean();
  };

  const emitError = () => {
    sources[url].emitError(new Error("Test error"));
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
    stopServer,
    getSource,
    emitError,
    emitListenerEvent,
  };
};

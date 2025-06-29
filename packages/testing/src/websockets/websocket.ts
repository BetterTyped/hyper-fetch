import WS from "jest-websocket-mock";
import {
  ListenerInstance,
  ExtractListenerResponseType,
  EmitterInstance,
  ExtractListenerTopicType,
  ExtendListener,
  ExtendEmitter,
  ExtractEmitterTopicType,
  ExtractEmitterPayloadType,
  ExtractEmitterHasPayloadType,
} from "@hyper-fetch/sockets";
import { ExtractUrlParams, EmptyTypes } from "@hyper-fetch/core";

const constructEventData = <T extends Record<string, any>>({ topic }: { topic: string }, data: T) => {
  return {
    data,
    topic,
  };
};

export const createWebsocketMockingServer = (url = "ws://localhost:1234") => {
  const server = { current: new WS(url) };

  const getServer = () => {
    return server.current;
  };

  const startServer = () => {
    WS.clean();
    server.current = new WS(url);
  };

  const stopServer = (options?: { code: number; reason: string; wasClean: boolean }): void => {
    getServer().close(options);
    WS.clean();
  };

  const emitListenerEvent = <T extends ListenerInstance>(
    listener: ExtendListener<
      T,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      { hasParams: ExtractUrlParams<ExtractListenerTopicType<T>> extends EmptyTypes ? false : true }
    >,
    event: ExtractListenerResponseType<T> extends Record<string, any>
      ? ExtractListenerResponseType<T>
      : Record<string, any>,
  ) => {
    const newEvent = constructEventData(listener, event);

    getServer().send(
      JSON.stringify({
        topic: newEvent.topic,
        data: newEvent.data,
      }),
    );
  };

  const expectEmitterEvent = <T extends EmitterInstance, Data extends ExtractEmitterPayloadType<T> | void = void>(
    emitter: ExtendEmitter<
      T,
      {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        hasParams: ExtractUrlParams<ExtractEmitterTopicType<T>> extends EmptyTypes ? false : true;
        hasData: Data extends void ? (ExtractEmitterHasPayloadType<T> extends false ? true : false) : false;
      }
    >,
    payload?: Data,
  ) => {
    return expect(getServer()).toReceiveMessage(
      JSON.stringify({
        topic: emitter.topic,
        data: payload ?? emitter.payload,
      }),
      { timeout: 5000 },
    );
  };

  return {
    url,
    getServer,
    startServer,
    stopServer,
    emitListenerEvent,
    expectEmitterEvent,
  };
};

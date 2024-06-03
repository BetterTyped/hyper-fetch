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
  ExtractEmitterHasDataType,
} from "@hyper-fetch/sockets";
import { ExtractRouteParams, NegativeTypes } from "@hyper-fetch/core";

const constructEventData = <T extends Record<string, any>>({ topic }: { topic: string }, data: T) => {
  return {
    data,
    topic,
  };
};

export const createWebsocketMockingServer = () => {
  const url = "ws://localhost:1234";
  let server = new WS(url);

  const startServer = (): void => {
    server = new WS(url);
  };

  const resetMocks = () => {
    if (server) {
      server.close();
      WS.clean();
    }
  };

  const stopServer = (): void => {
    server.close();
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

    server.send(JSON.stringify(data));
  };

  const expectEmitterEvent = async <T extends EmitterInstance, Data extends ExtractEmitterPayloadType<T> | void = void>(
    emitter: ExtendEmitter<
      T,
      {
        hasParams: ExtractRouteParams<ExtractEmitterTopicType<T>> extends NegativeTypes ? false : true;
        hasData: Data extends void ? (ExtractEmitterHasDataType<T> extends false ? true : false) : false;
      }
    >,
    data?: Data,
  ) => {
    await expect(server).toReceiveMessage(
      JSON.stringify({
        topic: emitter.topic,
        data: data ?? emitter.data,
      }),
      { timeout: 5000 },
    );
  };

  return {
    url,
    server,
    startServer,
    stopServer,
    resetMocks,
    emitListenerEvent,
    expectEmitterEvent,
  };
};

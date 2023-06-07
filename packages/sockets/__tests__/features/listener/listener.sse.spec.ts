import { waitFor } from "@testing-library/dom";
import { sources } from "eventsourcemock";

import { createListener } from "../../utils/listener.utils";
import { createSocket } from "../../utils/socket.utils";
import { sendWsEvent, createWsServer, wsUrl } from "../../websocket/websocket.server";
import { sleep } from "../../utils/helpers.utils";
import { sseAdapter } from "adapter";
import { sendSseEvent } from "../../websocket/sse.server";

const config = {
  adapter: sseAdapter,
};

type DataType = { endpoint: string; age: number };

describe("Listener [ SSE ]", () => {
  let socket = createSocket(config);
  let listener = createListener<DataType>(socket);

  beforeEach(() => {
    createWsServer();
    socket = createSocket(config);
    listener = createListener<DataType>(socket);
    jest.resetAllMocks();
    sources[wsUrl].emitOpen();
  });

  it("should listen to given event endpoint", async () => {
    const spy = jest.fn();
    const message = { endpoint: "Maciej", age: 99 };
    let receivedExtra;
    listener.listen({
      callback: (data) => {
        spy(data);
        receivedExtra = data.extra;
      },
    });

    sendSseEvent(listener, message);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledOnceWith({ data: message, extra: receivedExtra });
    });

    await sleep(10);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should allow to remove given listener", async () => {
    const spy = jest.fn();
    const removeListener = listener.listen({ callback: (data) => spy(data) });
    const message = { endpoint: "Maciej", age: 99 };
    sendWsEvent(listener, message);
    expect(spy).toHaveBeenCalledOnce();
    removeListener();
    sendWsEvent(listener, message);
    sendWsEvent(listener, message);
    sendWsEvent(listener, message);
    expect(spy).toHaveBeenCalledOnce();
  });

  it("should allow to set params", async () => {
    const spy = jest.fn();
    const listenerWithParams = socket.createListener<ResponseType>()({ endpoint: "test/:testId" });
    const removeListener = listenerWithParams.listen({ params: { testId: 1 }, callback: (data) => spy(data) });
    const message = { endpoint: "Maciej", age: 99 };
    sendWsEvent(listenerWithParams.setParams({ testId: 1 }), message);
    expect(spy).toHaveBeenCalledOnce();
    removeListener();
    sendWsEvent(listenerWithParams, message);
    sendWsEvent(listenerWithParams, message);
    sendWsEvent(listenerWithParams, message);
    expect(spy).toHaveBeenCalledOnce();
  });

  it("should allow for using onData", async () => {
    const spy = jest.fn();
    let receivedData;
    const removeListener = listener
      .onData(({ data }) => {
        receivedData = data;
        spy();
      })
      .listen({ callback: () => null });
    const message = { endpoint: "Maciej", age: 99 };
    sendWsEvent(listener, message);
    expect(spy).toHaveBeenCalledOnce();
    expect(receivedData).toStrictEqual(message);
    removeListener();
  });
});

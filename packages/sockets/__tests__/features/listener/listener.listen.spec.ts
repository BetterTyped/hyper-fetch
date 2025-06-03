import { waitFor } from "@testing-library/dom";
import { createWebsocketMockingServer, sleep } from "@hyper-fetch/testing";

import { createListener } from "../../utils/listener.utils";
import { createSocket } from "../../utils/socket.utils";

type DataType = { topic: string; age: number };

describe("Listener [ Listen ]", () => {
  const { startServer, emitListenerEvent } = createWebsocketMockingServer();
  let socket = createSocket();
  let listener = createListener<DataType>(socket);

  beforeEach(async () => {
    startServer();
    socket = createSocket();
    listener = createListener<DataType>(socket);
    jest.resetAllMocks();
  });

  it("should listen to given event topic", async () => {
    const spy = jest.fn();
    const message = { topic: "Maciej", age: 99 };
    let receivedExtra: any;

    listener.listen((data) => {
      spy(data);
      receivedExtra = data.extra;
    });

    emitListenerEvent(listener, message);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenCalledWith({ data: message, extra: receivedExtra });
    });

    await sleep(10);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should allow to remove given listener", async () => {
    const spy = jest.fn();
    const removeListener = listener.listen(spy);
    const message = { topic: "Maciej", age: 99 };
    emitListenerEvent(listener, message);
    expect(spy).toHaveBeenCalledOnce();
    removeListener();
    emitListenerEvent(listener, message);
    emitListenerEvent(listener, message);
    emitListenerEvent(listener, message);
    expect(spy).toHaveBeenCalledOnce();
  });

  it("should allow to set params", async () => {
    const spy = jest.fn();
    const listenerWithParams = socket.createListener<{ response: ResponseType }>()({ topic: "test/:testId" });
    const removeListener = listenerWithParams.setParams({ testId: 1 }).listen(spy);
    const message = { topic: "Maciej", age: 99 };
    emitListenerEvent(listenerWithParams.setParams({ testId: 1 }), message);
    expect(spy).toHaveBeenCalledOnce();
    removeListener();
    emitListenerEvent(listenerWithParams, message);
    emitListenerEvent(listenerWithParams, message);
    emitListenerEvent(listenerWithParams, message);
    expect(spy).toHaveBeenCalledOnce();
  });
});

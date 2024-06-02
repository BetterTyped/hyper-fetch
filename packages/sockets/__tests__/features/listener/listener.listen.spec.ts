import { waitFor } from "@testing-library/dom";

import { createListener } from "../../utils/listener.utils";
import { createSocket } from "../../utils/socket.utils";
import { sendWsEvent, createWsServer } from "../../websocket/websocket.server";
import { sleep } from "../../utils/helpers.utils";

type DataType = { topic: string; age: number };

describe("Listener [ Listen ]", () => {
  let socket = createSocket();
  let listener = createListener<DataType>(socket);

  beforeEach(() => {
    createWsServer();
    socket = createSocket();
    listener = createListener<DataType>(socket);
    jest.resetAllMocks();
  });

  it("should listen to given event topic", async () => {
    const spy = jest.fn();
    const message = { topic: "Maciej", age: 99 };
    let receivedExtra;
    listener.listen((data) => {
      spy(data);
      receivedExtra = data.extra;
    });
    sendWsEvent(listener, message);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledOnceWith({ data: message, extra: receivedExtra });
    });

    await sleep(10);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should allow to remove given listener", async () => {
    const spy = jest.fn();
    const removeListener = listener.listen(spy);
    const message = { topic: "Maciej", age: 99 };
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
    const listenerWithParams = socket.createListener<{ response: ResponseType }>()({ topic: "test/:testId" });
    const removeListener = listenerWithParams.listen(spy, { params: { testId: 1 } });
    const message = { topic: "Maciej", age: 99 };
    sendWsEvent(listenerWithParams.setParams({ testId: 1 }), message);
    expect(spy).toHaveBeenCalledOnce();
    removeListener();
    sendWsEvent(listenerWithParams, message);
    sendWsEvent(listenerWithParams, message);
    sendWsEvent(listenerWithParams, message);
    expect(spy).toHaveBeenCalledOnce();
  });
});

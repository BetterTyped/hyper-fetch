import { waitFor } from "@testing-library/dom";
import { sources } from "eventsourcemock";

import { createListener } from "../../utils/listener.utils";
import { createSocket } from "../../utils/socket.utils";
import { wsUrl } from "../../websocket/websocket.server";
import { sleep } from "../../utils/helpers.utils";
import { sseAdapter } from "adapter";
import { sendSseEvent } from "../../websocket/sse.server";

const config = {
  adapter: sseAdapter,
};

type DataType = { topic: string; age: number };

describe("Listener [ SSE ]", () => {
  let socket = createSocket(config);
  let listener = createListener<DataType>(socket);

  beforeEach(() => {
    socket = createSocket(config);
    listener = createListener<DataType>(socket);
    jest.resetAllMocks();
    sources[wsUrl].emitOpen();
  });

  it("should listen to given event topic", async () => {
    const spy = jest.fn();
    const message = { topic: "Maciej", age: 99 };
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
    const message = { topic: "Maciej", age: 99 };
    sendSseEvent(listener, message);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledOnce();
    });

    removeListener();
    sendSseEvent(listener, message);
    sendSseEvent(listener, message);
    sendSseEvent(listener, message);
    expect(spy).toHaveBeenCalledOnce();
  });

  it("should allow to set params", async () => {
    const spy = jest.fn();
    const listenerWithParams = socket.createListener<{ response: ResponseType }>()({ topic: "test/:testId" });
    const removeListener = listenerWithParams.listen({ params: { testId: 1 }, callback: (data) => spy(data) });
    const message = { topic: "Maciej", age: 99 };
    sendSseEvent(listenerWithParams.setParams({ testId: 1 }), message);
    expect(spy).toHaveBeenCalledOnce();
    removeListener();
    sendSseEvent(listenerWithParams, message);
    sendSseEvent(listenerWithParams, message);
    sendSseEvent(listenerWithParams, message);
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
    const message = { topic: "Maciej", age: 99 };
    sendSseEvent(listener, message);
    expect(spy).toHaveBeenCalledOnce();
    expect(receivedData).toStrictEqual(message);
    removeListener();
  });
});

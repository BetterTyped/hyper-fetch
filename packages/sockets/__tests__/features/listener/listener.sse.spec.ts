import { waitFor } from "@testing-library/dom";
import { createSseMockingServer } from "@hyper-fetch/testing";

import { createListener } from "../../utils/listener.utils";
import { createSocket } from "../../utils/socket.utils";
import { sleep } from "../../utils/helpers.utils";
import { ServerSentEventsAdapter } from "adapter";

const { startServer, emitListenerEvent, emitOpen, waitForConnection } = createSseMockingServer();

const config = {
  adapter: ServerSentEventsAdapter,
};

type DataType = { topic: string; age: number };

describe("Listener [ SSE ]", () => {
  let socket = createSocket(config);
  let listener = createListener<DataType>(socket);

  beforeEach(async () => {
    startServer();
    socket = createSocket(config);
    listener = createListener<DataType>(socket);
    jest.resetAllMocks();
    await waitForConnection();
    emitOpen();
  });

  it("should listen to given event topic", async () => {
    const spy = jest.fn();
    const message = { topic: "Maciej", age: 99 };
    let receivedExtra;

    listener.listen((data) => {
      spy(data);
      receivedExtra = data.extra;
    });

    emitListenerEvent(listener, message);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledOnceWith({ data: message, extra: receivedExtra });
    });

    await sleep(10);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should allow to remove given listener", async () => {
    const spy = jest.fn();
    const removeListener = listener.listen((data) => spy(data));
    const message = { topic: "Maciej", age: 99 };
    emitListenerEvent(listener, message);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledOnce();
    });

    removeListener();
    emitListenerEvent(listener, message);
    emitListenerEvent(listener, message);
    emitListenerEvent(listener, message);
    expect(spy).toHaveBeenCalledOnce();
  });

  it("should allow to set params", async () => {
    const spy = jest.fn();
    const listenerWithParams = socket.createListener<{ response: ResponseType }>()({ topic: "test/:testId" });
    const removeListener = listenerWithParams.listen((data) => spy(data), { params: { testId: 1 } });
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

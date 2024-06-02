import { waitFor } from "@testing-library/dom";
import { ServerSentEventsAdapter, ServerSentEventsAdapterType, Socket, SocketOptionsType } from "@hyper-fetch/sockets";

import { createSseMockingServer } from "../../src";

const { url, startServer, stopServer, emitError, emitListenerEvent } = createSseMockingServer();

const socketOptions: SocketOptionsType<ServerSentEventsAdapterType> = {
  url,
  adapter: ServerSentEventsAdapter,
  adapterOptions: { eventSourceInit: { withCredentials: true } },
};

describe("SSE Mocking [ Base ]", () => {
  let socket = new Socket<ServerSentEventsAdapterType>(socketOptions);

  beforeEach(() => {
    startServer();
    socket = new Socket<ServerSentEventsAdapterType>(socketOptions);
    jest.resetAllMocks();
  });

  afterEach(() => {
    stopServer();
  });

  it("should emit and receive error event", async () => {
    const spy = jest.fn();
    socket.events.onError(spy);
    emitError();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(new Error());
    });
  });

  it("should receive message from server", async () => {
    const spy = jest.fn();
    const data = { name: "Maciej" };

    const listener = socket
      .createListener<{ name: string }>()({
        topic: "test/:testId",
      })
      .setParams({ testId: 1 });

    const unmount = listener.listen((response) => {
      expect(response.extra).toBeInstanceOf(MessageEvent);
      spy(response.data);
    });

    emitListenerEvent(listener, data);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(data);
    });

    unmount();
  });
});

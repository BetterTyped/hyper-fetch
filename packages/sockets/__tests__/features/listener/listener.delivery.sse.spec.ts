import { createSseMockingServer, waitForConnection } from "@hyper-fetch/testing";
import { ServerSentEventsAdapter } from "adapter-sse/sse-adapter";

import { createListener } from "../../utils/listener.utils";
import { createSocket } from "../../utils/socket.utils";

type DataType = { price: number };

describe("Listener [ Delivery SSE ]", () => {
  const { startServer, emitListenerEvent } = createSseMockingServer();
  let socket = createSocket({ adapter: ServerSentEventsAdapter });

  beforeEach(async () => {
    socket = createSocket({ adapter: ServerSentEventsAdapter });
    startServer();
    await waitForConnection(socket);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should batch SSE messages", () => {
    const listener = createListener<DataType>(socket, { delivery: { strategy: "batch", interval: 100 } });
    const spy = vi.fn();
    listener.listen(({ data }) => spy(data));
    emitListenerEvent(listener, { price: 1 });
    emitListenerEvent(listener, { price: 2 });
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalledWith([{ price: 1 }, { price: 2 }]);
  });

  it("should sample SSE messages", () => {
    const listener = createListener<DataType>(socket, { delivery: { strategy: "latest", interval: 100 } });
    const spy = vi.fn();
    listener.listen(({ data }) => spy(data));
    emitListenerEvent(listener, { price: 1 });
    emitListenerEvent(listener, { price: 2 });
    expect(spy).toHaveBeenCalledWith({ price: 1 });
    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenLastCalledWith({ price: 2 });
  });

  it("should drop pending SSE messages on unsubscribe", () => {
    const listener = createListener<DataType>(socket, { delivery: { strategy: "batch", interval: 100 } });
    const spy = vi.fn();
    const stop = listener.listen(spy);
    emitListenerEvent(listener, { price: 1 });
    stop();
    vi.advanceTimersByTime(100);
    expect(spy).not.toHaveBeenCalled();
  });
});

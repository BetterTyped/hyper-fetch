import { ServerSentEventsAdapter } from "adapter-sse";
import { Socket } from "socket";

import {
  ControlledEventSource,
  installControlledEventSource,
  openEventSource,
  uninstallControlledEventSource,
  waitForEventSource,
} from "../../utils/controlled-event-source";

describe("Socket SSE [ Named events ]", () => {
  let socket: Socket<ReturnType<typeof ServerSentEventsAdapter>>;

  beforeEach(() => {
    installControlledEventSource();
    socket = new Socket({ url: "http://named-events", adapter: ServerSentEventsAdapter(), reconnectTime: 100 });
  });

  afterEach(async () => {
    await socket.disconnect();
    uninstallControlledEventSource();
  });

  it("should deliver a named event to the listeners of the topic with the event name", async () => {
    const source = await openEventSource();
    const callback = vi.fn();
    socket.createListener<{ count: number }>()({ topic: "tick" }).listen(callback);

    source.serverSendNamed("tick", JSON.stringify({ count: 1 }));

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0].data).toStrictEqual({ count: 1 });
    expect(callback.mock.calls[0][0].extra).toBeInstanceOf(MessageEvent);
  });

  it("should deliver named events to listeners registered before the connection opened", async () => {
    const callback = vi.fn();
    socket.createListener<number>()({ topic: "tick" }).listen(callback);
    const source = await openEventSource();

    source.serverSendNamed("tick", "5");

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ data: 5 }));
  });

  it("should keep the raw text when the data is not JSON", async () => {
    const source = await openEventSource();
    const callback = vi.fn();
    socket.createListener<string>()({ topic: "status" }).listen(callback);

    source.serverSendNamed("status", "ready to go");

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ data: "ready to go" }));
  });

  it("should not deliver named events of other topics", async () => {
    const source = await openEventSource();
    const callback = vi.fn();
    socket.createListener<number>()({ topic: "tick" }).listen(callback);

    source.serverSendNamed("tock", "1");

    expect(callback).not.toHaveBeenCalled();
  });

  it("should stop delivering after the last listener of the topic left", async () => {
    const source = await openEventSource();
    const callback = vi.fn();
    const stop = socket.createListener<number>()({ topic: "tick" }).listen(callback);

    stop();
    source.serverSendNamed("tick", "1");

    expect(callback).not.toHaveBeenCalled();
  });

  it("should keep delivering to the other listeners of the topic", async () => {
    const source = await openEventSource();
    const first = vi.fn();
    const second = vi.fn();
    const listener = socket.createListener<number>()({ topic: "tick" });
    const stopFirst = listener.listen(first);
    listener.listen(second);

    stopFirst();
    source.serverSendNamed("tick", "1");

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("should deliver named events on a new EventSource after a reconnect", async () => {
    await openEventSource();
    const callback = vi.fn();
    socket.createListener<number>()({ topic: "tick" }).listen(callback);

    const reconnected = socket.reconnect();
    const source = await openEventSource(2);
    await reconnected;
    source.serverSendNamed("tick", "2");

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ data: 2 }));
  });

  it("should ignore named events of a replaced EventSource", async () => {
    const first = await openEventSource();
    const callback = vi.fn();
    socket.createListener<number>()({ topic: "tick" }).listen(callback);

    socket.reconnect();
    await waitForEventSource(2);
    first.serverSendNamed("tick", "1");

    expect(callback).not.toHaveBeenCalled();
  });

  it("should decode named events with the decode option", async () => {
    await socket.disconnect();
    socket = new Socket({
      url: "http://named-events",
      adapter: ServerSentEventsAdapter(),
      adapterOptions: {
        decode: (event) => ({ topic: event.type, data: { raw: event.data } }),
      },
    });
    const source = await openEventSource(2);
    const callback = vi.fn();
    socket.createListener<{ raw: string }>()({ topic: "tick" }).listen(callback);

    source.serverSendNamed("tick", "7");

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ data: { raw: "7" } }));
  });

  it("should keep delivering unnamed { topic, data } messages", async () => {
    const source = await openEventSource();
    const callback = vi.fn();
    socket.createListener<number>()({ topic: "tick" }).listen(callback);

    source.serverEmit("tick", 3);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ data: 3 }));
  });

  it("should not register a second handler for the default message event", async () => {
    const source = await openEventSource();
    const callback = vi.fn();
    socket.createListener<number>()({ topic: "message" }).listen(callback);

    source.serverEmit("message", 1);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(ControlledEventSource.instances).toHaveLength(1);
  });
});

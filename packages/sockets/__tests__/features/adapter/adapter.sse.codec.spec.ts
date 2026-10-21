import { createSseMockingServer } from "@hyper-fetch/testing";
import { waitFor } from "@testing-library/dom";
import type { SSEAdapterOptionsType, ServerSentEventsAdapterType } from "adapter-sse";
import { ServerSentEventsAdapter } from "adapter-sse";

import { createSocket } from "../../utils/socket.utils";

const decode: SSEAdapterOptionsType["decode"] = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === "ping") {
    return null;
  }
  return { topic: message.type, data: message.payload };
};

describe("SSE Adapter [ Decode ]", () => {
  const { startServer, getSource } = createSseMockingServer();

  const send = (data: string) => getSource().emitMessage(new MessageEvent("message", { data }));

  const setup = async (adapterOptions?: SSEAdapterOptionsType) => {
    const socket = createSocket<ServerSentEventsAdapterType>({
      adapter: ServerSentEventsAdapter,
      adapterOptions,
    });
    await startServer();
    return socket;
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should receive { topic, data } messages by default", async () => {
    const socket = await setup();
    const spy = vi.fn();
    socket
      .createListener()({ topic: "user" })
      .listen(({ data }) => spy(data));

    send(JSON.stringify({ topic: "user", data: { name: "Alice" } }));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({ name: "Alice" });
    });
  });

  it("should map incoming messages to listener topics with custom decode", async () => {
    const socket = await setup({ decode });
    const spy = vi.fn();
    socket
      .createListener()({ topic: "user" })
      .listen(({ data }) => spy(data));

    send(JSON.stringify({ type: "user", payload: { name: "Alice" } }));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({ name: "Alice" });
    });
  });

  it("should ignore messages decoded to null", async () => {
    const socket = await setup({ decode });
    const eventSpy = vi.fn();
    socket.events.onListenerEvent(eventSpy);

    send(JSON.stringify({ type: "ping" }));
    send(JSON.stringify({ type: "user", payload: 1 }));

    await waitFor(() => {
      expect(eventSpy).toHaveBeenCalledTimes(1);
    });
    expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({ topic: "user", data: 1 }));
  });

  it("should report decoder errors and keep the connection", async () => {
    const error = new Error("Malformed message");
    const socket = await setup({
      decode: (event) => {
        if (event.data === "broken") {
          throw error;
        }
        return decode(event);
      },
    });
    const errorSpy = vi.fn();
    const spy = vi.fn();
    socket.onError(errorSpy);
    socket.createListener()({ topic: "user" }).listen(spy);

    send("broken");
    send(JSON.stringify({ type: "user", payload: 1 }));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith({ error });
    expect(socket.adapter.connected).toBe(true);
  });
});

import { createWebsocketMockingServer } from "@hyper-fetch/testing";
import type { EmitterInstance } from "emitter";
import { interceptConnection, interceptEmitter, interceptListener, Socket } from "socket";

describe("Socket [ Utils ]", () => {
  const { url, startServer, stopServer } = createWebsocketMockingServer();
  beforeEach(() => {
    vi.resetAllMocks();
    startServer();
  });

  afterEach(() => {
    stopServer();
  });

  it("should throw on invalid listener interceptor", async () => {
    const socket = new Socket({ url });

    socket.onMessage(() => null);
    expect(() => interceptListener(socket.unstable_onMessageCallbacks, { data: {}, extra: {} } as any)).toThrow();
  });

  it("should throw on invalid listener interceptor", async () => {
    const socket = new Socket({ url });

    socket.onSend(() => null as any);
    expect(() => interceptEmitter(socket.unstable_onSendCallbacks, {} as EmitterInstance)).toThrow();
  });

  it("should throw on invalid connect interceptor", async () => {
    const socket = new Socket({ url, adapterOptions: { autoConnect: false } });

    socket.onConnect(() => null as any);
    await expect(
      interceptConnection(socket.unstable_onConnectCallbacks, {
        connection: { url, queryParams: undefined, adapterOptions: undefined },
        attempt: 0,
      }),
    ).rejects.toThrow("Connect modifier must return connection");
  });

  it("should chain connect interceptors sequentially", async () => {
    const socket = new Socket({ url, adapterOptions: { autoConnect: false } });
    const order: string[] = [];

    socket.onConnect(async ({ connection }) => {
      await new Promise((resolve) => {
        setTimeout(resolve, 5);
      });
      order.push("first");
      return { ...connection, url: `${connection.url}/1` };
    });
    socket.onConnect(({ connection }) => {
      order.push("second");
      return { ...connection, url: `${connection.url}/2` };
    });

    const result = await interceptConnection(socket.unstable_onConnectCallbacks, {
      connection: { url, queryParams: undefined, adapterOptions: undefined },
      attempt: 0,
    });

    expect(order).toEqual(["first", "second"]);
    expect(result.url).toBe(`${url}/1/2`);
  });
});

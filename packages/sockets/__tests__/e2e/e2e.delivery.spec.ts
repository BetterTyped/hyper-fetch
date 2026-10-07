/**
 * @vitest-environment node
 */
import { Socket } from "@hyper-fetch/sockets";
import { createWebsocketE2EServer, sleep, waitForConnection } from "@hyper-fetch/testing";

const wsServer = createWebsocketE2EServer();

describe("E2E [ WebSocket Delivery ]", () => {
  let url: string;

  beforeAll(async () => {
    url = await wsServer.startServer();
  });

  afterAll(async () => {
    await wsServer.stopServer();
  });

  it("should batch a real stream without losing messages", async () => {
    const socket = new Socket({ url });
    await waitForConnection(socket);
    const listener = socket.createListener<{ id: number }>()({
      topic: "trades",
      delivery: { strategy: "batch", interval: 100 },
    });
    const batches: { id: number }[][] = [];
    listener.listen(({ data }) => batches.push(data));
    await sleep(50);

    for (let i = 1; i <= 30; i += 1) {
      wsServer.sendToAll("trades", { id: i });
    }
    await sleep(400);

    expect(batches.length).toBeGreaterThanOrEqual(1);
    expect(batches.length).toBeLessThan(30);
    expect(batches.flat().map((m) => m.id)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
    await socket.disconnect();
  });

  it("should sample a real stream and end on the newest message", async () => {
    const socket = new Socket({ url });
    await waitForConnection(socket);
    const listener = socket.createListener<{ id: number }>()({
      topic: "prices",
      delivery: { strategy: "latest", interval: 100 },
    });
    const received: number[] = [];
    listener.listen(({ data }) => received.push(data.id));
    await sleep(50);

    for (let i = 1; i <= 30; i += 1) {
      wsServer.sendToAll("prices", { id: i });
    }
    await sleep(400);

    expect(received.length).toBeLessThan(30);
    expect(received[0]).toBe(1);
    expect(received.at(-1)).toBe(30);
    await socket.disconnect();
  });

  it("should deliver nothing after unsubscribe", async () => {
    const socket = new Socket({ url });
    await waitForConnection(socket);
    const listener = socket.createListener<{ id: number }>()({
      topic: "late",
      delivery: { strategy: "batch", interval: 100 },
    });
    const spy = vi.fn();
    const stop = listener.listen(spy);
    await sleep(50);
    wsServer.sendToAll("late", { id: 1 });
    await sleep(20);
    stop();
    await sleep(300);
    expect(spy).not.toHaveBeenCalled();
    await socket.disconnect();
  });
});

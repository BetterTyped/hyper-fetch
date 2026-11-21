/**
 * @vitest-environment jsdom
 */
import { Socket } from "@hyper-fetch/sockets";
import { createHttpMockingServer, createWebsocketE2EServer, sleep, waitForConnection } from "@hyper-fetch/testing";

const { startServer, stopServer, getConnectedCount } = createWebsocketE2EServer();
// msw patches the global WebSocket and forwards unmocked connections with listeners of its own on the instance
const mocking = createHttpMockingServer();

/**
 * The WebSocket of jsdom - the one of browser-like test environments - also wrapped by msw, the way apps mock their
 * APIs in development. Closing must reach the real server in both cases.
 */
describe("E2E [ WebSocket Connection in jsdom ]", () => {
  let url: string;

  beforeAll(async () => {
    url = await startServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  describe.each([
    ["jsdom", false],
    ["jsdom with msw", true],
  ])("When the WebSocket is the one of %s", (_name, withMsw) => {
    beforeEach(() => {
      if (withMsw) {
        mocking.startServer();
      }
    });

    afterEach(() => {
      if (withMsw) {
        mocking.stopServer();
      }
    });

    it("should end the connection on the server when disconnecting", async () => {
      const socket = new Socket({ url, adapterOptions: { autoConnect: false } });
      await socket.connect();
      await waitForConnection(socket);
      await vi.waitFor(() => expect(getConnectedCount()).toBe(1));

      await socket.disconnect();
      await sleep(200);

      expect(getConnectedCount()).toBe(0);
    });

    it("should end the replaced connection on the server when reconnecting", async () => {
      const socket = new Socket({ url, adapterOptions: { autoConnect: false } });
      await socket.connect();
      await waitForConnection(socket);

      await socket.reconnect();
      await waitForConnection(socket);
      await sleep(200);

      expect(getConnectedCount()).toBe(1);
      await socket.disconnect();
      await sleep(200);
      expect(getConnectedCount()).toBe(0);
    });
  });
});

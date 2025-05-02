import { Client } from "@hyper-fetch/core";
import { Socket } from "@hyper-fetch/sockets";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { WebSocketServer } from "ws";
import waitForExpect from "wait-for-expect";

// import { BackendDevtools } from "../../src/index";
import { initializeWebsocketServer } from "../websockets.initialize";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("Backend Devtools - Socket Test", () => {
  let wss: WebSocketServer;
  const socket = new Socket({ url: "ws://localhost:1234" });
  const socketListener = socket.createListener()({ topic: "test" });
  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest()({ endpoint: "/shared-endpoint" });
  // let backendDevtools = new BackendDevtools(client);

  beforeAll(() => {
    wss = initializeWebsocketServer(1234);
    startServer();
  });
  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    // backendDevtools = new BackendDevtools(client);
    request = client.createRequest()({ endpoint: "/shared-endpoint" });
    jest.resetAllMocks();
    jest.clearAllMocks();
    resetMocks();
  });
  afterEach(() => {
    // backendDevtools.unmountHooksFromClient();
  });

  afterAll(() => {
    wss.close();
    stopServer();
  });
  it("test call for backend dev", async () => {
    const spy = jest.fn();
    const removeListener = socketListener.listen(spy);
    mockRequest(request);
    await request.send();

    await waitForExpect(() => {
      expect(spy).toHaveBeenCalled();
    }, 1000);
    removeListener();
  });
});

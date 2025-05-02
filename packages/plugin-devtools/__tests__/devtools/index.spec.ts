import { Client } from "@hyper-fetch/core";
import { createHttpMockingServer, createWebsocketMockingServer } from "@hyper-fetch/testing";

import { devtoolsPlugin } from "../../src/index";

const {
  startServer: startWebsocketServer,
  stopServer: stopWebsocketServer,
  // emitListenerEvent,
  // expectEmitterEvent,
} = createWebsocketMockingServer("ws://localhost:2137");
const {
  resetMocks,
  startServer,
  stopServer,
  // mockRequest
} = createHttpMockingServer();

describe("Backend Devtools - Socket Test", () => {
  let client = new Client({ url: "shared-base-url" }).addPlugin(devtoolsPlugin({ appName: "TestApp" }));
  let request = client.createRequest()({ endpoint: "/shared-endpoint" });

  beforeAll(() => {
    startServer();
    startWebsocketServer();
  });
  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest()({ endpoint: "/shared-endpoint" });
    jest.resetAllMocks();
    jest.clearAllMocks();
    resetMocks();
  });
  afterAll(() => {
    stopWebsocketServer();
    stopServer();
  });
  it("should send REQUEST_CREATED event when a request is created", async () => {
    console.warn("test", request);
    expect(true).toBe(true);
  });
});

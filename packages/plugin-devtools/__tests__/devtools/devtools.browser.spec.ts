// @vitest-environment jsdom
import { Client } from "@hyper-fetch/core";

import { DevtoolsPlugin } from "../../src/index";

describe("DevtoolsPlugin [ Browser ]", () => {
  it("should leave the WebSocket to the browser", async () => {
    const plugin = DevtoolsPlugin({ appName: "App", url: "ws://localhost:1" });
    new Client({ url: "http://localhost:5000" }).addPlugin(plugin);
    const socket = plugin.data.eventHandler!.socket;

    // Without an option the sockets adapter takes the global WebSocket
    expect(socket.adapter.adapterOptions?.WebSocket).toBeUndefined();

    socket.reconnectAttempts = 0;
    await socket.disconnect();
  });
});

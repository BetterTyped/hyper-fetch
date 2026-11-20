import { createClient } from "@hyper-fetch/core";
import { MessageOrigin } from "@hyper-fetch/plugin-devtools";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { PluginConnectionStatus } from "@server/types/connection.type";
import { waitFor } from "@testing-library/react";
import { once } from "node:events";
import { WebSocket } from "ws";

import { createHyperFlowEnv } from "../../utils/hyper-flow";
import { useApplications } from "@/store/applications/apps.store";
import { useCacheStore } from "@/store/applications/cache.store";
import { useConnectionStore } from "@/store/applications/connection.store";

const { startServer, stopServer, resetMocks, mockRequest } = createHttpMockingServer();

describe("Application stores [ E2E ]", () => {
  const env = createHyperFlowEnv();

  beforeAll(() => startServer());
  afterAll(() => stopServer());

  beforeEach(async () => {
    resetMocks();
    await env.start();
  });

  afterEach(async () => {
    await env.stop();
  });

  const setup = async () => {
    const client = createClient({ url: "http://localhost:5000" });
    const { plugin, disconnect } = env.connectApp({ client });
    const getUsers = client.createRequest<{ response: { id: number }[] }>()({ endpoint: "/users" });
    env.renderApp();
    await env.waitForApp(plugin);
    return { client, getUsers, disconnect };
  };

  it("should ignore the invalidation of a key it never saw cached", async () => {
    const { client, getUsers } = await setup();
    mockRequest(getUsers, { data: [{ id: 1 }] });
    await getUsers.send();
    await waitFor(() => expect(useCacheStore.getState().applications.App.caches.get(getUsers.cacheKey)).toBeDefined());
    const cached = useCacheStore.getState().applications.App.caches.get(getUsers.cacheKey);

    client.cache.invalidate("never-cached");
    // Events arrive in order, so once this invalidation shows the one before it was handled
    client.cache.invalidate(getUsers.cacheKey);

    await waitFor(() =>
      expect(useCacheStore.getState().applications.App.caches.get(getUsers.cacheKey)?.cacheData.staleTime).toBe(0),
    );
    const { caches } = useCacheStore.getState().applications.App;
    expect([...caches.keys()]).toStrictEqual([getUsers.cacheKey]);
    expect(caches.get(getUsers.cacheKey)?.cacheData.data).toStrictEqual(cached?.cacheData.data);
  });

  it("should ignore the hangup of a plugin that never finished its handshake", async () => {
    const { disconnect } = await setup();
    const half = new WebSocket(`ws://localhost:${env.getPort()}?connectionName=Half&origin=${MessageOrigin.PLUGIN}`);
    await once(half, "open");
    await waitFor(() => expect(env.getServer()?.connections.Half).toBeDefined());

    half.close();
    await waitFor(() => expect(env.getServer()?.connections.Half.pluginStatus).toBe(PluginConnectionStatus.HANGUP));
    // The renderer gets the hangups in order, so once the app shows as disconnected the first one was handled
    await disconnect();

    await waitFor(() => expect(useConnectionStore.getState().connections.App.connected).toBeFalse());
    expect(Object.keys(useConnectionStore.getState().connections)).toStrictEqual(["App"]);
    expect(Object.keys(useApplications.getState().applications)).toStrictEqual(["App"]);
  });
});

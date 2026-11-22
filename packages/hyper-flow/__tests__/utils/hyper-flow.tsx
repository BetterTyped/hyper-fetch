import type { ClientInstance } from "@hyper-fetch/core";
import { createClient } from "@hyper-fetch/core";
import { DevtoolsPlugin } from "@hyper-fetch/plugin-devtools";
import type { DevtoolsDb } from "@hyper-fetch/plugin-devtools";
import type { SocketInstance } from "@hyper-fetch/sockets";
import type { StartServer } from "@server/server";
import { startServer } from "@server/server";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import type { RenderResult } from "@testing-library/react";
import { act, cleanup, getConfig, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import type { StoreApi } from "zustand";

import { resetElectronStore } from "../vitest.setup";
import { routeTree } from "@/routeTree.gen";
import { useApplications } from "@/store/applications/apps.store";
import { useCacheStatsStore } from "@/store/applications/cache-stats.store";
import { useCacheStore } from "@/store/applications/cache.store";
import { useConnectionStore } from "@/store/applications/connection.store";
import { useDbStore } from "@/store/applications/db.store";
import { useErrorStatsStore } from "@/store/applications/error-stats.store";
import { useInitializerStore } from "@/store/applications/initialization.store";
import { useMethodStatsStore } from "@/store/applications/method-stats.store";
import { useNetworkStatsStore } from "@/store/applications/network-stats.store";
import { useNetworkStore } from "@/store/applications/network.store";
import { useQueueStatsStore } from "@/store/applications/queue-stats.store";
import { useQueueStore } from "@/store/applications/queue.store";
import { useSocketsStore } from "@/store/applications/sockets.store";
import { useSettings } from "@/store/general/settings.store";
import { useTracking } from "@/store/general/tracking.store";

/**
 * Every store is a module singleton, so state would leak between specs without this.
 */
export const resetStores = () => {
  const reset = <State,>(store: StoreApi<State>) => store.setState(store.getInitialState(), true);
  reset(useApplications);
  reset(useCacheStatsStore);
  reset(useCacheStore);
  reset(useConnectionStore);
  reset(useErrorStatsStore);
  reset(useInitializerStore);
  reset(useMethodStatsStore);
  reset(useNetworkStatsStore);
  reset(useNetworkStore);
  reset(useQueueStatsStore);
  reset(useQueueStore);
  reset(useSocketsStore);
  reset(useDbStore);
  reset(useSettings);
  reset(useTracking);
  useConnectionStore.setState({ connections: {} });
  useApplications.setState({ applications: {} });
};

export const getRandomPort = () => 20_000 + Math.floor(Math.random() * 40_000);

const createTestRouter = (url: string) =>
  createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [url] }),
  });

export type HyperFlowView = RenderResult & {
  user: ReturnType<typeof userEvent.setup>;
  router: ReturnType<typeof createTestRouter>;
  navigate: (to: string) => Promise<void>;
};

type ConnectedApp = {
  client: ClientInstance;
  plugin: ReturnType<typeof DevtoolsPlugin>;
  disconnect: () => Promise<void>;
};

/**
 * Full HyperFlow environment: the real devtools server, the real renderer with its router and stores, and user
 * applications that report through the real `DevtoolsPlugin`. Only the user's backend is mocked, at the network.
 */
export const createHyperFlowEnv = () => {
  let server: StartServer | null = null;
  let apps: ConnectedApp[] = [];
  let unmount: (() => void) | null = null;
  let port = getRandomPort();
  let isWarm = false;

  const boot = async () => {
    resetStores();
    resetElectronStore();
    port = getRandomPort();
    server = await startServer({ port });
    if (server.errorMessage) {
      port = getRandomPort();
      server = await startServer({ port });
    }
    useSettings.getState().setServerPort(port);
  };

  const stop = async () => {
    unmount?.();
    unmount = null;
    await Promise.all(apps.map((app) => app.disconnect()));
    apps = [];
    server?.wss?.clients.forEach((ws) => ws.terminate());
    await new Promise<void>((resolve) => {
      server?.wss?.close(() => resolve());
      if (!server?.wss) {
        resolve();
      }
    });
    await new Promise<void>((resolve) => {
      server?.server?.close(() => resolve());
      if (!server?.server) {
        resolve();
      }
    });
    server = null;
  };

  const renderApp = ({ url = "/" }: { url?: string } = {}): HyperFlowView => {
    const router = createTestRouter(url);

    const user = userEvent.setup();
    const view = render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    );
    unmount = view.unmount;

    const navigate = async (to: string) => {
      await act(async () => {
        await router.navigate({ to });
      });
    };

    return { ...view, user, router, navigate };
  };

  /** Connect a user application the same way users do: a client with `DevtoolsPlugin` pointed at HyperFlow. */
  const connectApp = <Client extends ClientInstance>({
    appName = "App",
    client,
    environment,
    sockets,
    dbs,
  }: {
    appName?: string;
    client?: Client;
    environment?: string;
    /** Sockets to inspect, passed to the plugin's `sockets` option */
    sockets?: SocketInstance[];
    /** Dbs to inspect, passed to the plugin's `dbs` option */
    dbs?: DevtoolsDb[];
  } = {}) => {
    const resolvedClient = (client ?? createClient({ url: "http://localhost:5000" })) as Client;
    const plugin = DevtoolsPlugin({ appName, url: `ws://localhost:${port}`, environment, sockets, dbs });
    resolvedClient.addPlugin(plugin);

    const app: ConnectedApp = {
      client: resolvedClient,
      plugin,
      disconnect: async () => {
        const socket = plugin.data.eventHandler?.socket;
        if (!socket) {
          return;
        }
        socket.reconnectAttempts = 0;
        await socket.disconnect();
      },
    };
    apps.push(app);

    return { client: resolvedClient, plugin, disconnect: app.disconnect };
  };

  /** Resolves once HyperFlow finished the handshake with the plugin and the plugin flushes events. */
  const waitForApp = async (plugin: ReturnType<typeof DevtoolsPlugin>, appName = "App") => {
    await waitFor(() => {
      expect(useConnectionStore.getState().connections[appName]?.connected).toBe(true);
      expect(plugin.data.eventHandler?.isInitialized).toBe(true);
    });
  };

  /**
   * Every spec file runs in a new process, so its first render runs React, the router, the stores and the socket code
   * for the first time, while V8 still compiles them. On a busy machine that costs several times a later render, and
   * whichever test came first spent it inside its 1000ms `waitFor`. The warm-up spends it before the first test: it
   * connects an application and renders HyperFlow until the handshake is done. Waiting for the handshake event, not
   * polling with a deadline, is what lets it absorb the cold start.
   */
  const warmUp = async () => {
    await boot();
    const { plugin } = connectApp();
    renderApp();
    await getConfig().asyncWrapper(
      () =>
        new Promise<void>((resolve) => {
          const isReady = () =>
            !!useConnectionStore.getState().connections.App?.connected && !!plugin.data.eventHandler?.isInitialized;
          const finish = () => {
            if (!isReady()) {
              return;
            }
            unsubscribeStore();
            unsubscribePlugin?.();
            resolve();
          };
          const unsubscribeStore = useConnectionStore.subscribe(finish);
          // Registered after the plugin's own listener, so it runs once the plugin marked itself initialized
          const unsubscribePlugin = plugin.data.eventHandler?.socketListener.listen(finish);
          finish();
        }),
    );
    await stop();
    // Removes the container too, so the first test starts with an empty document
    cleanup();
  };

  /** Starts the HyperFlow server with fresh stores, the first call of a spec file warms the renderer up before */
  const start = async () => {
    if (!isWarm) {
      isWarm = true;
      await warmUp();
    }
    await boot();
  };

  return {
    start,
    stop,
    renderApp,
    connectApp,
    waitForApp,
    getPort: () => port,
    getServer: () => server,
  };
};

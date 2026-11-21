import { DevtoolsPlugin } from "@hyper-fetch/plugin-devtools";
import type { StartServer } from "@server/server";
import { startServer } from "@server/server";
import { screen, within } from "@testing-library/react";

import { getRandomPort } from "../../utils/hyper-flow";

/** The dashboard card of one application. */
export const getApplicationCard = (appName: string) => screen.getByTestId(`application-link-card-${appName}`);

export const findApplicationCard = (appName: string) => screen.findByTestId(`application-link-card-${appName}`);

/** Names of the application cards in the order the dashboard renders them. */
export const getRenderedApplicationNames = () =>
  screen
    .queryAllByTestId(/^application-link-card-/)
    .map((card) => card.dataset.testid!.replace("application-link-card-", ""));

export const getCardConnectionLabel = (appName: string) => {
  const card = within(getApplicationCard(appName));
  if (card.queryByText("Connected")) {
    return "Connected";
  }
  if (card.queryByText("Disconnected")) {
    return "Disconnected";
  }
  return null;
};

/** Closes a server started with `startServer`, including its open sockets. */
export const closeServer = async (server: StartServer | null) => {
  server?.wss?.clients.forEach((ws) => ws.terminate());
  await new Promise<void>((resolve) => {
    if (!server?.wss) {
      resolve();
      return;
    }
    server.wss.close(() => resolve());
  });
  await new Promise<void>((resolve) => {
    if (!server?.server) {
      resolve();
      return;
    }
    server.server.close(() => resolve());
  });
};

/** A second HyperFlow server, as the Electron main process would start it after a port change. */
export const startSecondServer = async (excludedPort: number) => {
  let port = getRandomPort();
  while (port === excludedPort) {
    port = getRandomPort();
  }
  let server = await startServer({ port });
  if (server.errorMessage) {
    port = getRandomPort();
    server = await startServer({ port });
  }
  return { server, port };
};

/** A plugin pointed at an arbitrary HyperFlow port, for apps that are not connected through `env.connectApp`. */
export const createPluginForPort = (appName: string, port: number) => {
  const plugin = DevtoolsPlugin({ appName, url: `ws://localhost:${port}` });
  const disconnect = async () => {
    const socket = plugin.data.eventHandler?.socket;
    if (!socket) {
      return;
    }
    socket.reconnectAttempts = 0;
    await socket.disconnect();
  };
  return { plugin, disconnect };
};

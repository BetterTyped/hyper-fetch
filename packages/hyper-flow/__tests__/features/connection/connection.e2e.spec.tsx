import { createClient } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { screen, waitFor } from "@testing-library/react";

import { createHyperFlowEnv } from "../../utils/hyper-flow";
import { useApplications } from "@/store/applications/apps.store";
import { useConnectionStore } from "@/store/applications/connection.store";
import { useNetworkStore } from "@/store/applications/network.store";

const { startServer, stopServer, resetMocks, mockRequest } = createHttpMockingServer();

const isConnected = (name: string) => !!useConnectionStore.getState().connections[name]?.connected;
const getRequests = (name: string) => useNetworkStore.getState().applications[name]?.requests ?? [];

describe("Connection [ E2E ]", () => {
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

  const createApp = (appName: string, environment?: string) => {
    const client = createClient({ url: `http://localhost:5000/${appName}` });
    const request = client.createRequest<{ response: { name: string } }>()({ endpoint: "/me" });
    mockRequest(request, { data: { name: appName } });
    const app = env.connectApp({ appName, client, environment });
    return { ...app, request };
  };

  it("should register the application with what the plugin reports", async () => {
    const { plugin } = createApp("Shop", "staging");
    env.renderApp();
    await env.waitForApp(plugin, "Shop");

    expect(useApplications.getState().applications.Shop).toMatchObject({
      name: "Shop",
      environment: "staging",
      url: "http://localhost:5000/Shop",
    });
  });

  it("should keep requests of many applications apart", async () => {
    const shop = createApp("Shop");
    const admin = createApp("Admin");
    env.renderApp();
    await env.waitForApp(shop.plugin, "Shop");
    await env.waitForApp(admin.plugin, "Admin");

    await shop.request.send();
    await shop.request.send();
    await admin.request.send();

    await waitFor(() => {
      expect(getRequests("Shop").filter((item) => item.isFinished)).toHaveLength(2);
      expect(getRequests("Admin").filter((item) => item.isFinished)).toHaveLength(1);
    });
    expect(getRequests("Admin")[0].response?.data).toStrictEqual({ name: "Admin" });
  });

  it("should show requests sent before HyperFlow was opened", async () => {
    const { plugin, request } = createApp("App");
    await waitFor(() => expect(plugin.data.eventHandler?.isConnected).toBeTrue());
    await request.send();

    env.renderApp();
    await env.waitForApp(plugin);

    await waitFor(() => {
      expect(getRequests("App")).toHaveLength(1);
      expect(getRequests("App")[0].isFinished).toBeTrue();
    });
  });

  it("should mark only the application whose plugin disconnected as offline", async () => {
    const shop = createApp("Shop");
    const admin = createApp("Admin");
    env.renderApp();
    await env.waitForApp(shop.plugin, "Shop");
    await env.waitForApp(admin.plugin, "Admin");

    await shop.disconnect();

    await waitFor(() => expect(isConnected("Shop")).toBeFalse());
    expect(isConnected("Admin")).toBeTrue();
  });

  it("should bring an application back online and keep receiving its requests after a reconnect", async () => {
    const { plugin, request } = createApp("App");
    env.renderApp();
    await env.waitForApp(plugin);

    await plugin.data.eventHandler?.socket.disconnect();
    await waitFor(() => expect(isConnected("App")).toBeFalse());

    await plugin.data.eventHandler?.socket.connect();
    await waitFor(() => expect(isConnected("App")).toBeTrue());

    await request.send();
    await waitFor(() => expect(getRequests("App").filter((item) => item.isFinished)).toHaveLength(1));
  });

  it("should mark every application offline when the HyperFlow server goes down", async () => {
    const shop = createApp("Shop");
    const admin = createApp("Admin");
    env.renderApp();
    await env.waitForApp(shop.plugin, "Shop");
    await env.waitForApp(admin.plugin, "Admin");

    env.getServer()?.wss?.clients.forEach((ws) => ws.terminate());

    await waitFor(() => {
      expect(isConnected("Shop")).toBeFalse();
      expect(isConnected("Admin")).toBeFalse();
    });
  });

  it("should reconnect the applications after the renderer is reloaded", async () => {
    const { plugin, request } = createApp("App");
    const first = env.renderApp();
    await env.waitForApp(plugin);
    first.unmount();
    await waitFor(() => expect(env.getServer()?.getAppConnection()).toBeNull());

    env.renderApp();
    await waitFor(() => expect(env.getServer()?.getAppConnection()).not.toBeNull());
    await env.waitForApp(plugin);
    await request.send();

    await waitFor(() => expect(getRequests("App").filter((item) => item.isFinished)).toHaveLength(1));
  });

  it("should close the renderer connection when HyperFlow unmounts", async () => {
    const { plugin } = createApp("App");
    const view = env.renderApp();
    await env.waitForApp(plugin);

    view.unmount();

    await waitFor(() => expect(env.getServer()?.getAppConnection()).toBeNull());
  });

  it("should open an application page before the application connects", async () => {
    const view = env.renderApp({ url: "/applications/App/network" });

    expect(await screen.findByText(/waiting for/i)).toBeInTheDocument();

    const { plugin, request } = createApp("App");
    await env.waitForApp(plugin);
    await request.send();

    expect(await screen.findByText("/me")).toBeInTheDocument();
    expect(view.router.state.location.pathname).toBe("/applications/App/network");
  });

  it("should keep a known but offline application browsable", async () => {
    const { plugin, request, disconnect } = createApp("App");
    const view = env.renderApp();
    await env.waitForApp(plugin);
    await request.send();
    await waitFor(() => expect(getRequests("App")).toHaveLength(1));

    await disconnect();
    await waitFor(() => expect(isConnected("App")).toBeFalse());
    await view.navigate("/applications/App/network");

    expect(await screen.findByText("Offline")).toBeInTheDocument();
    expect(screen.getByText("/me")).toBeInTheDocument();
  });
});

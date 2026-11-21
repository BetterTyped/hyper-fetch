import { createClient } from "@hyper-fetch/core";
import type { StartServer } from "@server/server";
import { screen, waitFor, within } from "@testing-library/react";
import type { IncomingMessage } from "node:http";
import type { WebSocket } from "ws";

import { createHyperFlowEnv } from "../../utils/hyper-flow";
import { closeServer, createPluginForPort, findApplicationCard, startSecondServer } from "./dashboard.helpers";
import { ConnectionName } from "@/constants/connection.name";
import { useConnectionStore } from "@/store/applications/connection.store";
import { useSettings } from "@/store/general/settings.store";

const restart = vi.mocked(window.electron.server.restart);
const status = vi.mocked(window.electron.server.status);

const isFrontendSocket = (request: IncomingMessage) =>
  (request.url ?? "").includes(`connectionName=${ConnectionName.HF_DEVTOOLS_FRONTEND}`);

describe("Dashboard [ Settings ]", () => {
  const env = createHyperFlowEnv();
  let secondServer: StartServer | null = null;
  let cleanups: (() => Promise<void>)[] = [];

  beforeEach(async () => {
    await env.start();
  });

  afterEach(async () => {
    await Promise.all(cleanups.map((cleanup) => cleanup()));
    cleanups = [];
    await env.stop();
    await closeServer(secondServer);
    secondServer = null;
    restart.mockReset();
    status.mockReset();
  });

  /** Opens the port dialog and submits the given value. */
  const changePort = async (view: ReturnType<typeof env.renderApp>, port: string) => {
    await view.user.click(await screen.findByRole("button", { name: /Change Port/ }));
    const dialog = within(await screen.findByRole("dialog"));
    const input = dialog.getByLabelText("Port Number");
    await view.user.clear(input);
    await view.user.type(input, port);
    await view.user.click(dialog.getByRole("button", { name: "Save Changes" }));
    return dialog;
  };

  it("should show the port the bridge uses and a running server", async () => {
    status.mockResolvedValue(true);
    env.renderApp({ url: "/settings" });

    expect(await screen.findByText(String(env.getPort()))).toBeInTheDocument();
    expect(await screen.findByText("Running")).toBeInTheDocument();
    expect(screen.queryByText("Server Crashed")).not.toBeInTheDocument();
  });

  it("should show a crashed server and restart it on the current port", async () => {
    const port = env.getPort();
    status.mockResolvedValue(false);
    restart.mockResolvedValue({
      running: true,
      port,
      success: true,
      message: "Server restarted on current port",
    });
    const view = env.renderApp({ url: "/settings" });

    expect(await screen.findByText("Server Crashed")).toBeInTheDocument();
    expect(screen.getByText("Crashed")).toBeInTheDocument();
    const alert = within(screen.getByText("Server Crashed").closest<HTMLElement>('[role="alert"]')!);
    await view.user.click(alert.getByRole("button", { name: "Restart Server" }));

    expect(restart).toHaveBeenCalledWith({ port });
    expect(await screen.findByText("Server restarted on current port")).toBeInTheDocument();
  });

  it("should restart the server on the new port and connect the bridge to it", async () => {
    const second = await startSecondServer(env.getPort());
    secondServer = second.server;
    const frontendSockets: WebSocket[] = [];
    second.server.wss?.on("connection", (ws, request) => {
      if (isFrontendSocket(request)) {
        frontendSockets.push(ws);
      }
    });
    restart.mockResolvedValue({
      running: true,
      port: second.port,
      success: true,
      message: "Server restarted",
    });

    const view = env.renderApp({ url: "/settings" });
    await screen.findByText(String(env.getPort()));
    await changePort(view, String(second.port));

    await waitFor(() => {
      expect(useSettings.getState().settings.serverPort).toBe(second.port);
    });
    expect(restart).toHaveBeenCalledWith({ port: second.port });
    expect(await screen.findByText(String(second.port))).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(frontendSockets).toHaveLength(1);
    });

    // An application using the new port shows up as connected.
    const client = createClient({ url: "http://localhost:5000" });
    const { plugin, disconnect } = createPluginForPort("Moved", second.port);
    cleanups.push(disconnect);
    client.addPlugin(plugin);
    await waitFor(() => {
      expect(useConnectionStore.getState().connections.Moved?.connected).toBe(true);
    });
    await view.navigate("/");
    expect(await findApplicationCard("Moved")).toBeInTheDocument();
  });

  it("should close the bridge connection to the previous port after a port change", async () => {
    const oldFrontendSockets: WebSocket[] = [];
    env.getServer()?.wss?.on("connection", (ws, request) => {
      if (isFrontendSocket(request)) {
        oldFrontendSockets.push(ws);
      }
    });
    const second = await startSecondServer(env.getPort());
    secondServer = second.server;
    restart.mockResolvedValue({
      running: true,
      port: second.port,
      success: true,
      message: "Server restarted",
    });

    const view = env.renderApp({ url: "/settings" });
    await waitFor(() => {
      expect(oldFrontendSockets.length).toBeGreaterThan(0);
    });
    await changePort(view, String(second.port));
    await waitFor(() => {
      expect(useSettings.getState().settings.serverPort).toBe(second.port);
    });

    await waitFor(() => {
      expect(oldFrontendSockets.filter((ws) => ws.readyState === ws.OPEN)).toHaveLength(0);
    });
  });

  it("should keep the current port when the restart fails", async () => {
    const port = env.getPort();
    restart.mockResolvedValue({
      running: false,
      port,
      success: false,
      message: "Port 3000 is already in use",
    });

    const view = env.renderApp({ url: "/settings" });
    await screen.findByText(String(port));
    const dialog = await changePort(view, "3000");

    expect(await screen.findByText("Port 3000 is already in use")).toBeInTheDocument();
    expect(useSettings.getState().settings.serverPort).toBe(port);
    expect(dialog.getByLabelText("Port Number")).toBeInTheDocument();
  });

  it("should reject a port out of range without restarting the server", async () => {
    const port = env.getPort();
    const view = env.renderApp({ url: "/settings" });
    await screen.findByText(String(port));

    const dialog = await changePort(view, "70000");

    // The number input's `max` blocks the submit before the schema runs, so the dialog simply stays open.
    expect(dialog.getByLabelText("Port Number")).toHaveValue(70_000);
    expect(restart).not.toHaveBeenCalled();
    expect(useSettings.getState().settings.serverPort).toBe(port);
  });

  it("should persist the new port", async () => {
    const second = await startSecondServer(env.getPort());
    secondServer = second.server;
    restart.mockResolvedValue({
      running: true,
      port: second.port,
      success: true,
      message: "Server restarted",
    });

    const view = env.renderApp({ url: "/settings" });
    await screen.findByText(String(env.getPort()));
    await changePort(view, String(second.port));

    await waitFor(() => {
      expect(JSON.parse(String(window.electron.store.get("settings"))).state.settings.serverPort).toBe(second.port);
    });
  });
});

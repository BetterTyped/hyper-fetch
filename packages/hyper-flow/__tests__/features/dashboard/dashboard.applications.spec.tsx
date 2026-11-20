import { createClient } from "@hyper-fetch/core";
import { screen, waitFor, within } from "@testing-library/react";

import { createHyperFlowEnv, resetStores } from "../../utils/hyper-flow";
import {
  findApplicationCard,
  getApplicationCard,
  getCardConnectionLabel,
  getRenderedApplicationNames,
} from "./dashboard.helpers";
import type { Application } from "@/store/applications/apps.store";
import { defaultSimulatedError, useApplications } from "@/store/applications/apps.store";
import { useConnectionStore } from "@/store/applications/connection.store";

const persistedApplication = (name: string): Application => ({
  name,
  environment: "production",
  adapterName: "http",
  url: "http://persisted.local",
  settings: {
    simulatedErrors: { Default: defaultSimulatedError },
    maxRequestsHistorySize: 1000,
  },
});

describe("Dashboard [ Applications ]", () => {
  const env = createHyperFlowEnv();

  beforeEach(async () => {
    await env.start();
  });

  afterEach(async () => {
    await env.stop();
  });

  it("should list a connected application with its url, adapter and online state", async () => {
    const client = createClient({ url: "http://localhost:5000/api" });
    const { plugin } = env.connectApp({
      appName: "Shop",
      client,
      environment: "staging",
    });

    env.renderApp();
    await env.waitForApp(plugin, "Shop");

    const card = within(await findApplicationCard("Shop"));
    expect(card.getByRole("heading", { name: "Shop" })).toBeInTheDocument();
    expect(card.getByText("http://localhost:5000/api")).toBeInTheDocument();
    expect(card.getByText("http")).toBeInTheDocument();
    expect(card.getByText("Connected")).toBeInTheDocument();
    expect(card.getByText("Application is currently active and connected")).toBeInTheDocument();
    expect(useApplications.getState().applications.Shop).toMatchObject({
      name: "Shop",
      environment: "staging",
      adapterName: "http",
      url: "http://localhost:5000/api",
    });
  });

  it("should mark the application offline when the plugin disconnects", async () => {
    const { plugin, disconnect } = env.connectApp({ appName: "Shop" });
    const view = env.renderApp();
    await env.waitForApp(plugin, "Shop");
    await findApplicationCard("Shop");

    await disconnect();

    await waitFor(() => {
      expect(getCardConnectionLabel("Shop")).toBe("Disconnected");
    });
    expect(within(getApplicationCard("Shop")).getByText("Application is currently offline")).toBeInTheDocument();

    await view.navigate("/applications/Shop");
    expect(await screen.findByText("Offline")).toBeInTheDocument();
  });

  it("should not show the offline badge for a connected application", async () => {
    const { plugin } = env.connectApp({ appName: "Shop" });
    const view = env.renderApp();
    await env.waitForApp(plugin, "Shop");

    await view.navigate("/applications/Shop");

    expect(await screen.findByTestId("application-page")).toBeInTheDocument();
    expect(screen.queryByText("Offline")).not.toBeInTheDocument();
  });

  it("should keep every application's own connection state when one of several disconnects", async () => {
    const alpha = env.connectApp({ appName: "Alpha" });
    env.renderApp();
    await env.waitForApp(alpha.plugin, "Alpha");
    const beta = env.connectApp({ appName: "Beta" });
    await env.waitForApp(beta.plugin, "Beta");

    await alpha.disconnect();

    await waitFor(() => {
      expect(useConnectionStore.getState().connections.Alpha?.connected).toBe(false);
    });
    expect(useConnectionStore.getState().connections.Beta?.connected).toBe(true);
    expect(getCardConnectionLabel("Alpha")).toBe("Disconnected");
    expect(getCardConnectionLabel("Beta")).toBe("Connected");
  });

  it("should list connected applications before offline ones", async () => {
    // Beta is known from a previous session, so it is listed first until the sort moves it.
    useApplications.getState().addApplication(persistedApplication("Beta"));
    const alpha = env.connectApp({ appName: "Alpha" });
    env.renderApp();
    await env.waitForApp(alpha.plugin, "Alpha");
    const beta = env.connectApp({ appName: "Beta" });
    await env.waitForApp(beta.plugin, "Beta");
    await waitFor(() => {
      expect(getRenderedApplicationNames()).toIncludeSameMembers(["Alpha", "Beta"]);
    });

    await beta.disconnect();

    await waitFor(() => {
      expect(getCardConnectionLabel("Beta")).toBe("Disconnected");
    });
    expect(getRenderedApplicationNames()).toStrictEqual(["Alpha", "Beta"]);
  });

  it("should list applications that never connected in this session after connected ones", async () => {
    useApplications.getState().addApplication(persistedApplication("Archived"));
    const live = env.connectApp({ appName: "Live" });

    env.renderApp();
    await env.waitForApp(live.plugin, "Live");

    await waitFor(() => {
      expect(getRenderedApplicationNames()).toStrictEqual(["Live", "Archived"]);
    });
    expect(getCardConnectionLabel("Archived")).toBe("Disconnected");
    expect(getCardConnectionLabel("Live")).toBe("Connected");
  });

  it("should open the application when its card is clicked", async () => {
    const { plugin } = env.connectApp({ appName: "Shop" });
    const view = env.renderApp();
    await env.waitForApp(plugin, "Shop");

    await view.user.click(
      within(await findApplicationCard("Shop")).getByRole("button", {
        name: /View Details/,
      }),
    );

    await waitFor(() => {
      expect(view.router.state.location.pathname).toBe("/applications/Shop");
    });
    expect(await screen.findByTestId("application-page")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Shop" })).toBeInTheDocument();
  });

  it("should remove an application from the list and from the persisted store", async () => {
    useApplications.getState().addApplication(persistedApplication("Archived"));
    const view = env.renderApp();
    const card = within(await findApplicationCard("Archived"));

    await view.user.click(card.getAllByRole("button")[0]);
    await view.user.click(await screen.findByRole("menuitem", { name: /Remove Application/ }));
    const dialog = within(await screen.findByRole("dialog"));
    await view.user.click(dialog.getByRole("button", { name: "Remove Application" }));

    await waitFor(() => {
      expect(screen.queryByTestId("application-link-card-Archived")).not.toBeInTheDocument();
    });
    expect(JSON.parse(String(window.electron.store.get("applications"))).state.applications).toStrictEqual({});
  });

  it("should restore persisted applications after a remount", async () => {
    const { plugin, disconnect } = env.connectApp({
      appName: "Shop",
      environment: "staging",
    });
    const view = env.renderApp();
    await env.waitForApp(plugin, "Shop");
    await findApplicationCard("Shop");
    await disconnect();
    view.unmount();

    // Simulate a fresh app start: in-memory state is gone, electron-store keeps what was persisted.
    const persisted = window.electron.store.get("applications");
    resetStores();
    window.electron.store.set("applications", persisted);
    await useApplications.persist.rehydrate();

    env.renderApp();

    const card = within(await findApplicationCard("Shop"));
    expect(card.getByText("http://localhost:5000")).toBeInTheDocument();
    expect(card.getByText("Disconnected")).toBeInTheDocument();
    expect(useApplications.getState().applications.Shop.environment).toBe("staging");
  });
});

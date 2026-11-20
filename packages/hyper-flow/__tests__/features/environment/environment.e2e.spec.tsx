import { createClient } from "@hyper-fetch/core";
import { screen, within } from "@testing-library/react";

import { createHyperFlowEnv } from "../../utils/hyper-flow";

describe("Environment [ E2E ]", () => {
  const env = createHyperFlowEnv();

  beforeEach(async () => {
    await env.start();
  });

  afterEach(async () => {
    await env.stop();
  });

  const setup = async ({ appName = "Shop", environment }: { appName?: string; environment?: string }) => {
    const client = createClient({ url: "http://localhost:5000" });
    const { plugin } = env.connectApp({ client, appName, environment });
    const view = env.renderApp();
    await env.waitForApp(plugin, appName);
    return view;
  };

  it("should show the reported environment on the application card", async () => {
    await setup({ environment: "staging" });

    const card = await screen.findByTestId("application-link-card-Shop");
    expect(within(card).getByTestId("application-environment-Shop")).toHaveTextContent("staging");
  });

  it("should show the reported environment on the application overview", async () => {
    const view = await setup({ environment: "production" });

    await view.navigate("/applications/Shop");

    expect(await screen.findByTestId("application-environment")).toHaveTextContent("production");
  });

  it("should not repeat the name when no environment was reported", async () => {
    const view = await setup({});

    const card = await screen.findByTestId("application-link-card-Shop");
    expect(within(card).queryByTestId("application-environment-Shop")).not.toBeInTheDocument();
    await view.navigate("/applications/Shop");
    await screen.findByText("General");
    expect(screen.queryByTestId("application-environment")).not.toBeInTheDocument();
  });

  it("should tell two environments of one application apart", async () => {
    const view = await setup({ appName: "Shop (frontend)", environment: "frontend" });
    const backend = env.connectApp({ appName: "Shop (backend)", environment: "backend" });
    await env.waitForApp(backend.plugin, "Shop (backend)");

    expect(
      within(await screen.findByTestId("application-link-card-Shop (frontend)")).getByText("frontend"),
    ).toBeInTheDocument();
    expect(within(screen.getByTestId("application-link-card-Shop (backend)")).getByText("backend")).toBeInTheDocument();
    expect(view.router.state.location.pathname).toBe("/");
  });
});

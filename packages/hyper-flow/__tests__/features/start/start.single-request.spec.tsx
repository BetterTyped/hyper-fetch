import { createClient } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { screen, waitFor } from "@testing-library/react";

import { createHyperFlowEnv } from "../../utils/hyper-flow";
import { getCard, getStatValue } from "./start.helpers";
import { useNetworkStore } from "@/store/applications/network.store";

const { startServer, stopServer, resetMocks, mockRequest } = createHttpMockingServer();

describe("Application overview [ Single request ]", () => {
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

  const setup = async ({ url = "http://localhost:5000" }: { url?: string } = {}) => {
    const client = createClient({ url });
    const { plugin } = env.connectApp({ client });
    const view = env.renderApp();
    await env.waitForApp(plugin);
    await view.navigate("/applications/App");
    await screen.findByText("Network Overview");
    return { client, view };
  };

  it("should say the url is not configured for a client without one", async () => {
    await setup({ url: "" });

    expect(screen.getByText("Not configured")).toBeInTheDocument();
  });

  it("should count one failed call in the singular", async () => {
    const { client, view } = await setup();
    const getUsers = client.createRequest<{ response: null; error: { message: string } }>()({
      endpoint: "/users",
    });
    mockRequest(getUsers, { status: 500, error: { message: "Boom" } });
    await getUsers.send();
    await waitFor(() => {
      expect(getStatValue(getCard("Network Overview"), "Total Requests")).toBe("1");
    });

    await view.user.click(screen.getByRole("tab", { name: /Performance/ }));
    await screen.findByText("Request Patterns");

    const patterns = getCard("Request Patterns");
    expect(patterns.getByText("1 call")).toBeInTheDocument();
    expect(patterns.getByText("1 failed request")).toBeInTheDocument();
  });

  it("should not open the request details from the recent requests", async () => {
    const { client, view } = await setup();
    const getUsers = client.createRequest<{ response: null }>()({ endpoint: "/users" });
    mockRequest(getUsers, { data: null });
    await getUsers.send();
    const recent = getCard("Recent Requests");
    const endpoint = await recent.findByText("/users");

    await view.user.click(endpoint);

    expect(useNetworkStore.getState().applications.App.detailsRequestId).toBeNull();
    expect(view.router.state.location.pathname).toBe("/applications/App");
  });
});

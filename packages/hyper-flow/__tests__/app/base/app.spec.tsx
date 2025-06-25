import "@testing-library/jest-dom";
import { render, act, waitFor } from "@testing-library/react";
import { sleep } from "@hyper-fetch/testing";
import { TestDashboardPage } from "@testing/pages/dashboard.page";
import { TestApplicationPage } from "@testing/pages/application.page";
import { StartServer, startServer } from "@server/server";
import { connectDevtoolsClient, connectDevtoolsFrontend } from "@testing/helpers/helpers";
import { ClientInstance, createClient } from "@hyper-fetch/core";

import { App } from "@/app";

describe("App", () => {
  let serverObject: StartServer | null = null;
  let client: ClientInstance;

  beforeEach(async () => {
    serverObject = await startServer({ port: 2137 });
    client = createClient({
      url: "http://localhost:2137",
    });
    await connectDevtoolsFrontend({
      socketAddress: "localhost",
      socketPort: 2137,
    });
    connectDevtoolsClient({
      client,
      appName: "App",
    });
  });
  afterEach(async () => {
    await serverObject?.server?.close();
    jest.clearAllMocks();
  });

  it("should render", async () => {
    const { container } = render(<App />);
    await act(async () => {
      await sleep(4000);
    });
    expect(container).toBeInTheDocument();
  });

  it("should render network page", async () => {
    const methods = render(<App />);

    const dashboardPage = new TestDashboardPage(methods);
    const applicationPage = new TestApplicationPage(methods);

    await waitFor(() => {
      expect(dashboardPage.applications.getApplication("App")).toBeInTheDocument();
    });

    await act(async () => {
      dashboardPage.applications.openApplication("App");
    });

    await waitFor(() => {
      expect(applicationPage.getPage()).toBeInTheDocument();
    });
  });
});

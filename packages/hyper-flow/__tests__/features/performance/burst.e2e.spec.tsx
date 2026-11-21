import { createClient } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { screen, waitFor } from "@testing-library/react";

import { createHyperFlowEnv } from "../../utils/hyper-flow";
import { useNetworkStatsStore } from "@/store/applications/network-stats.store";
import { useNetworkStore } from "@/store/applications/network.store";
import { useQueueStore } from "@/store/applications/queue.store";

const { startServer, stopServer, resetMocks, mockRequest } = createHttpMockingServer();

const BURST = 100;
// A burst is thousands of websocket events; this bounds the volume, it is not a speed target
const BURST_TIMEOUT = 15_000;

describe("Request bursts [ E2E ]", () => {
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

  const sendBurst = async (page: string) => {
    const client = createClient({ url: "http://localhost:5000" });
    const { plugin } = env.connectApp({ client });
    const view = env.renderApp();
    await env.waitForApp(plugin);
    await view.navigate(`/applications/App/${page}`);

    const requests = Array.from({ length: BURST }, (_, index) => {
      const request = client.createRequest<{ response: { index: number }; error: { message: string } }>()({
        endpoint: `/items/${index}`,
      });
      if (index % 10 === 0) {
        mockRequest(request, { status: 500, error: { message: "Down" } });
      } else {
        mockRequest(request, { data: { index } });
      }
      return request;
    });

    const responses = await Promise.all(requests.map((request) => request.send()));
    await waitFor(
      () => {
        const listed = useNetworkStore.getState().applications.App.requests;
        expect(listed.filter((item) => item.isFinished)).toHaveLength(BURST);
      },
      { timeout: BURST_TIMEOUT },
    );
    return { responses, view };
  };

  it.each(["network", "", "cache", "queues"])("should record every request of a burst on the %s page", async (page) => {
    const { responses } = await sendBurst(page);

    const listed = useNetworkStore.getState().applications.App.requests;
    expect(new Set(listed.map((item) => item.requestId)).size).toBe(BURST);
    expect(listed.filter((item) => item.isSuccess)).toHaveLength(responses.filter((item) => item.success).length);
    expect(useNetworkStatsStore.getState().applications.App.networkStats).toMatchObject({
      totalRequests: BURST,
      totalRequestsSuccess: 90,
      totalRequestsFailed: 10,
    });
    await waitFor(() => expect(useQueueStore.getState().applications.App.loadingKeys.size).toBe(0));
  });

  it("should list every request of a burst", async () => {
    await sendBurst("network");

    await waitFor(() => expect(screen.getAllByText(/^\/items\/\d+$/)).toHaveLength(BURST));
  });
});

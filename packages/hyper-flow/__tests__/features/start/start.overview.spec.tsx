import { createClient } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { screen, waitFor, within } from "@testing-library/react";

import { createHyperFlowEnv } from "../../utils/hyper-flow";
import { getCard, getStatValue, getTableRows, parseTime } from "./start.helpers";
import { useCacheStatsStore } from "@/store/applications/cache-stats.store";
import { useNetworkStore } from "@/store/applications/network.store";
import { formatBytes } from "@/utils/format";

const { startServer, stopServer, resetMocks, mockRequest } = createHttpMockingServer();

/**
 * Scenario used by most specs, sent one request at a time:
 * - GET    /users      cached,     200, x3
 * - GET    /users/:id  not cached, 200, x1 (id 1), 150ms delay - the slowest endpoint
 * - POST   /users      not cached, 400, x2, payload {"name":"Maciej"} (17 bytes each)
 * - DELETE /users/:id  not cached, 500, x1 (id 1)
 *
 * Expected by hand: 7 requests, 4 successful, 3 failed, 3 cached, 34 bytes sent.
 */
const SLOW_DELAY = 150;

/** React reports colliding list keys through console.error; rows with the same key can be dropped or mixed up. */
const spyOnDuplicateKeys = () => {
  const spy = vi.spyOn(console, "error");
  return () => {
    const duplicates = spy.mock.calls.filter((args) => args.some((arg) => String(arg).includes("same key")));
    spy.mockRestore();
    return duplicates;
  };
};

describe("Application overview [ E2E ]", () => {
  const env = createHyperFlowEnv();

  beforeAll(async () => {
    startServer();
    // The first request of the process pays for warming up fetch, which would distort the timing specs.
    const warmUp = createClient({
      url: "http://localhost:5000",
    }).createRequest()({ endpoint: "/warm-up" });
    mockRequest(warmUp, { data: null });
    await warmUp.send();
  });
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
    const { plugin } = env.connectApp({ client });

    const getUsers = client.createRequest<{ response: { id: number }[] }>()({
      endpoint: "/users",
      cache: true,
    });
    const getUser = client.createRequest<{ response: { id: number } }>()({
      endpoint: "/users/:id",
      cache: false,
    });
    const postUser = client.createRequest<{
      response: { id: number };
      payload: { name: string };
      error: { message: string };
    }>()({
      endpoint: "/users",
      method: "POST",
      cache: false,
    });
    const deleteUser = client.createRequest<{ response: null; error: { message: string } }>()({
      endpoint: "/users/:id",
      method: "DELETE",
      cache: false,
    });

    const view = env.renderApp();
    await env.waitForApp(plugin);
    await view.navigate("/applications/App");
    await screen.findByText("Network Overview");

    const sendScenario = async () => {
      mockRequest(getUsers, { data: [{ id: 1 }, { id: 2 }] });
      // Mocks match by endpoint prefix and the newest wins, so `/users` goes first and params are resolved.
      mockRequest(getUser.setParams({ id: 1 }), {
        data: { id: 1 },
        delay: SLOW_DELAY,
      });
      mockRequest(postUser, { status: 400, error: { message: "Invalid" } });
      mockRequest(deleteUser.setParams({ id: 1 }), {
        status: 500,
        error: { message: "Boom" },
      });

      await getUsers.send();
      await getUsers.send();
      await getUsers.send();
      await getUser.send({ params: { id: 1 } });
      await postUser.send({ payload: { name: "Maciej" } });
      await postUser.send({ payload: { name: "Maciej" } });
      await deleteUser.send({ params: { id: 1 } });

      await waitFor(() => {
        expect(getStatValue(getCard("Network Overview"), "Total Requests")).toBe("7");
      });
      await waitFor(() => {
        const { requests } = useNetworkStore.getState().applications.App;
        expect(requests).toHaveLength(7);
        expect(requests.every((item) => item.isFinished)).toBeTrue();
      });
    };

    return {
      client,
      plugin,
      view,
      getUsers,
      getUser,
      postUser,
      deleteUser,
      sendScenario,
    };
  };

  /** Response time of every finished request, measured the same way the cards describe it. */
  const getMeasuredResponseTimes = () =>
    useNetworkStore
      .getState()
      .applications.App.requests.map((item) => item.details!.responseTimestamp - item.response!.requestTimestamp);

  describe("General tab", () => {
    it("should show empty states and zero rates before any request", async () => {
      await setup();

      const network = getCard("Network Overview");
      expect(getStatValue(network, "Total Requests")).toBe("0");
      expect(getStatValue(network, "Success Requests")).toBe("0");
      expect(network.getByText("0.0%")).toBeInTheDocument();
      expect(getCard("Error Summary").getByText("No errors detected")).toBeInTheDocument();
      expect(getCard("Recent Requests").getByText("Waiting for API activity")).toBeInTheDocument();
      expect(
        getCard("Top traffic by Endpoint").getByText("No traffic data available for this application."),
      ).toBeInTheDocument();
    });

    it("should count total and successful requests and the success rate", async () => {
      const { sendScenario } = await setup();
      await sendScenario();

      const network = getCard("Network Overview");
      expect(getStatValue(network, "Total Requests")).toBe("7");
      expect(getStatValue(network, "Success Requests")).toBe("4");
      // 4 / 7
      expect(network.getByText("57.1%")).toBeInTheDocument();
      expect(network.getByText("http")).toBeInTheDocument();
    });

    it("should sum only the payloads that were actually sent", async () => {
      const { sendScenario } = await setup();
      await sendScenario();

      // Two POSTs with {"name":"Maciej"} = 2 * 17 bytes. GET and DELETE send no body.
      await waitFor(() => {
        expect(getStatValue(getCard("Network Overview"), "Total Sent")).toBe("34 Bytes");
      });
    });

    it("should count errors per endpoint and status", async () => {
      const { sendScenario } = await setup();
      await sendScenario();

      await waitFor(() => {
        expect(getCard("Error Summary").queryByText("No errors detected")).not.toBeInTheDocument();
      });
      const errors = getCard("Error Summary");
      const rows = errors.getAllByText(/ errors$/).map((badge) => badge.closest(".grid")!.textContent);
      expect(rows).toStrictEqual(["POST /users4002 errors", "DELETE /users/:id5001 errors"]);
    });

    it("should list every failing endpoint even when they share a status", async () => {
      const getDuplicateKeys = spyOnDuplicateKeys();
      const { client, view } = await setup();
      const getPosts = client.createRequest<{ error: { message: string } }>()({ endpoint: "/posts" });
      const getComments = client.createRequest<{ error: { message: string } }>()({ endpoint: "/comments" });
      mockRequest(getPosts, { status: 500, error: { message: "Boom" } });
      mockRequest(getComments, { status: 500, error: { message: "Boom" } });

      await getPosts.send();
      await getComments.send();
      await getComments.send();
      await waitFor(() => {
        expect(getStatValue(getCard("Network Overview"), "Total Requests")).toBe("3");
      });

      // Re-render with fresh stats to make sure rows keep their identity.
      await view.navigate("/applications/App/network");
      await view.navigate("/applications/App");
      const errors = getCard("Error Summary");
      await waitFor(() => {
        expect(errors.getAllByText(/ errors$/).map((badge) => badge.closest(".grid")!.textContent)).toStrictEqual([
          "GET /comments5002 errors",
          "GET /posts5001 errors",
        ]);
      });
      expect(getDuplicateKeys()).toStrictEqual([]);
    });

    it("should rank traffic by endpoint and method with its share of all requests", async () => {
      const getDuplicateKeys = spyOnDuplicateKeys();
      const { sendScenario } = await setup();
      await sendScenario();

      const traffic = getCard("Top traffic by Endpoint");
      const rows = traffic
        .getAllByText(/% \(\d+ requests?\)$/)
        .map((share) => share.parentElement!.textContent!.replaceAll(/\s+/g, " ").trim());
      expect(rows).toStrictEqual([
        "GET/users42.9% (3 requests)",
        "POST/users28.6% (2 requests)",
        "GET/users/:id14.3% (1 request)",
        "DELETE/users/:id14.3% (1 request)",
      ]);
      expect(getDuplicateKeys()).toStrictEqual([]);
    });

    it("should show the most recent requests first with their cache state", async () => {
      const { sendScenario } = await setup();
      await sendScenario();

      const rows = getTableRows(getCard("Recent Requests"));
      expect(rows.map((row) => row.split(" | ").slice(1, 3).join(" | "))).toStrictEqual([
        "DELETE/users/1 | Not cached",
        "POST/users | Not cached",
        "POST/users | Not cached",
        "GET/users/1 | Not cached",
        "GET/users | Cached",
        "GET/users | Cached",
        "GET/users | Cached",
      ]);
      const slowRow = rows[3].split(" | ");
      expect(parseTime(slowRow[4])).toBeGreaterThanOrEqual(SLOW_DELAY);
    });

    it("should cap recent requests at the eight newest", async () => {
      const { getUsers } = await setup();
      mockRequest(getUsers, { data: [] });

      for (let i = 0; i < 10; i++) {
        // eslint-disable-next-line no-await-in-loop
        await getUsers.send();
      }

      await waitFor(() => {
        expect(getStatValue(getCard("Network Overview"), "Total Requests")).toBe("10");
      });
      expect(getTableRows(getCard("Recent Requests"))).toHaveLength(8);
    });

    it("should open the network page from the recent requests card", async () => {
      const { view } = await setup();

      await view.user.click(screen.getByRole("link", { name: /View All Requests/ }));

      await waitFor(() => {
        expect(view.router.state.location.pathname).toBe("/applications/App/network");
      });
    });
  });

  describe("Performance tab", () => {
    const openPerformance = async (view: Awaited<ReturnType<typeof setup>>["view"]) => {
      await view.user.click(screen.getByRole("tab", { name: /Performance/ }));
      await screen.findByText("Request Patterns");
    };

    it("should show no data before any request", async () => {
      const { view } = await setup();
      await openPerformance(view);

      const patterns = getCard("Request Patterns");
      expect(patterns.getAllByText("No data available")).not.toHaveLength(0);
      expect(patterns.getByText("0.0%")).toBeInTheDocument();
      expect(patterns.getByText("No failed requests found")).toBeInTheDocument();
      expect(getCard("Slowest Endpoints").getByText("No endpoints statistics")).toBeInTheDocument();
    });

    it("should show the most used request, the slowest request and the error rate", async () => {
      const { view, sendScenario } = await setup();
      await sendScenario();
      await openPerformance(view);

      const patterns = getCard("Request Patterns");
      const mostUsed = patterns.getByText("Most used request").closest(".flex-col")!;
      expect(mostUsed.textContent).toContain("/users");
      expect(mostUsed.textContent).toContain("3 calls");
      const slowest = patterns.getByText("Slowest request").closest(".flex-col")!;
      // Measured times decide which one is slowest, so it must agree with the top of "Slowest Endpoints"
      const [slowestEndpoint] = getTableRows(getCard("Slowest Endpoints"))[0].split(" | ");
      expect(slowestEndpoint).toMatch(/^(GET|POST|DELETE)\//);
      expect(slowest.textContent).toContain(slowestEndpoint.replace(/^(GET|POST|DELETE)/, ""));
      // The slowest can't be faster than the request delayed on purpose
      expect(parseTime(/(\d+) ms avg/.exec(slowest.textContent!)?.[0])).toBeGreaterThanOrEqual(SLOW_DELAY);
      // 3 / 7
      expect(patterns.getByText("42.9%")).toBeInTheDocument();
      expect(patterns.getByText("3 failed requests")).toBeInTheDocument();
    });

    it("should rank the slowest endpoints, not methods", async () => {
      const { view, sendScenario } = await setup();
      await sendScenario();
      await openPerformance(view);

      const rows = getTableRows(getCard("Slowest Endpoints"));
      // One row per endpoint and method, slowest first. The ranking follows measured times, which a busy machine
      // can reorder, so it is checked against the times the card shows rather than assumed from the mock delays.
      expect(rows).toHaveLength(4);
      const times = rows.map((row) => parseTime(row.split(" | ")[1]));
      expect(times).toStrictEqual(times.toSorted((a, b) => b - a));
      const delayed = rows.find((row) => row.startsWith("GET/users/:id | "))!;
      expect(parseTime(delayed.split(" | ")[1])).toBeGreaterThanOrEqual(SLOW_DELAY);
      expect(rows.map((row) => row.split(" | ")[0])).toIncludeSameMembers([
        "GET/users/:id",
        "GET/users",
        "POST/users",
        "DELETE/users/:id",
      ]);
    });

    it("should show the arithmetic mean of all response times", async () => {
      const { view, sendScenario } = await setup();
      await sendScenario();
      await openPerformance(view);

      const times = getMeasuredResponseTimes();
      const mean = times.reduce((acc, time) => acc + time, 0) / times.length;
      const responses = getCard("Response Times");
      const shown = responses.getByText("Average response time").nextElementSibling!.textContent;
      expect(parseTime(shown)).toBeCloseTo(mean, 0);
    });

    it("should show response time percentiles of the measured requests", async () => {
      const { view, sendScenario } = await setup();
      await sendScenario();
      await openPerformance(view);

      const sorted = getMeasuredResponseTimes().toSorted((a, b) => a - b);
      const nearestRank = (percentile: number) => sorted[Math.ceil((percentile / 100) * sorted.length) - 1];
      const percentiles = within(screen.getByTestId("response-percentiles"));
      const shownTime = (label: string) => parseTime(percentiles.getByText(label).nextElementSibling!.textContent);

      expect(shownTime("p50")).toBeCloseTo(nearestRank(50), 0);
      expect(shownTime("p95")).toBeCloseTo(nearestRank(95), 0);
      expect(shownTime("p99")).toBeCloseTo(nearestRank(99), 0);
      // The request delayed on purpose is in the tail
      expect(shownTime("p99")).toBeGreaterThanOrEqual(SLOW_DELAY);
    });

    it("should not show NaN before any request", async () => {
      const { view } = await setup();
      await openPerformance(view);

      const responses = getCard("Response Times");
      expect(within(screen.getByTestId("response-percentiles")).getAllByText("-")).toHaveLength(3);
      expect(responses.queryByText(/NaN/)).not.toBeInTheDocument();
      responses.queryAllByRole("progressbar").forEach((bar) => {
        expect(bar.getAttribute("aria-valuenow") ?? "0").not.toBe("NaN");
      });
    });
  });

  describe("Cache tab", () => {
    const openCache = async (view: Awaited<ReturnType<typeof setup>>["view"]) => {
      await view.user.click(screen.getByRole("tab", { name: /Cache/ }));
      await screen.findByText("Cache Metrics");
    };

    it("should show empty cache cards before any request", async () => {
      const { view } = await setup();
      await openCache(view);

      expect(getCard("Cache Metrics").getByText("0.00%")).toBeInTheDocument();
      expect(getCard("Most Cached Endpoints").getByText("No cached endpoints found")).toBeInTheDocument();
      expect(getCard("Not Cached Requests").getByText("No requests found")).toBeInTheDocument();
    });

    it("should show the share of cached requests", async () => {
      const { view, sendScenario } = await setup();
      await sendScenario();
      await openCache(view);

      // 3 cached out of 7
      expect(getCard("Cache Metrics").getByText("42.86%")).toBeInTheDocument();
    });

    it("should show the cache size in a byte unit that matches its value", async () => {
      const { view, sendScenario } = await setup();
      await sendScenario();
      await openCache(view);

      const { cacheSize } = useCacheStatsStore.getState().applications.App.generalStats;
      expect(cacheSize).toBeGreaterThan(0);
      expect(getStatValue(getCard("Cache Metrics"), "Cache Size")).toBe(formatBytes(cacheSize));
    });

    it("should list cached and not cached endpoints with their entries", async () => {
      const getDuplicateKeys = spyOnDuplicateKeys();
      const { view, sendScenario, getUser } = await setup();
      await sendScenario();
      // A second id adds a second not-cached entry for the same endpoint.
      mockRequest(getUser.setParams({ id: 2 }), { data: { id: 2 } });
      await getUser.send({ params: { id: 2 } });
      await waitFor(() => {
        expect(getStatValue(getCard("Network Overview"), "Total Requests")).toBe("8");
      });
      await openCache(view);

      const cached = getTableRows(getCard("Most Cached Endpoints")).map((row) => row.split(" | ").slice(0, 2));
      expect(cached).toStrictEqual([["GET/users", "1"]]);

      const notCached = getTableRows(getCard("Not Cached Requests")).map((row) => row.split(" | ").slice(0, 2));
      expect(notCached).toIncludeSameMembers([
        ["GET/users/:id", "2"],
        ["POST/users", "1"],
        ["DELETE/users/:id", "1"],
      ]);
      expect(getDuplicateKeys()).toStrictEqual([]);
    });
  });
});

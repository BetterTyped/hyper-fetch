import { createClient } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { screen, waitFor, within } from "@testing-library/react";

import { createHyperFlowEnv } from "../../utils/hyper-flow";
import { useCacheStatsStore } from "@/store/applications/cache-stats.store";
import { formatBytes } from "@/utils/size.utils";

const { startServer, stopServer, resetMocks, mockRequest } = createHttpMockingServer();

describe("Application overview [ Cache distribution ]", () => {
  const env = createHyperFlowEnv();

  beforeAll(() => startServer());
  afterAll(() => stopServer());

  beforeEach(async () => {
    resetMocks();
    // jsdom has no layout, so the chart container is given the size a browser would measure
    const measure = HTMLElement.prototype.getBoundingClientRect;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function getRect(this: HTMLElement) {
      if (this.classList.contains("recharts-responsive-container")) {
        const size = { x: 0, y: 0, top: 0, left: 0, right: 400, bottom: 400, width: 400, height: 400 };
        return { ...size, toJSON: () => size };
      }
      return measure.call(this);
    });
    await env.start();
  });

  afterEach(async () => {
    await env.stop();
    vi.restoreAllMocks();
  });

  /** Caches one response per endpoint, each with a body of the given length, and opens the cache tab. */
  const setup = async (bodies: Record<string, number>) => {
    const client = createClient({ url: "http://localhost:5000" });
    const { plugin } = env.connectApp({ client });
    const view = env.renderApp();
    await env.waitForApp(plugin);
    await view.navigate("/applications/App");
    await screen.findByText("Network Overview");

    for (const [endpoint, length] of Object.entries(bodies)) {
      const request = client.createRequest<{ response: string }>()({ endpoint });
      mockRequest(request, { data: "x".repeat(length) });
      // eslint-disable-next-line no-await-in-loop
      await request.send();
    }
    await waitFor(() => {
      expect(useCacheStatsStore.getState().applications.App.cachesStats.size).toBe(Object.keys(bodies).length);
    });
    await view.user.click(screen.getByRole("tab", { name: /Cache/ }));
    await screen.findByText("Cache Distribution");

    return { view };
  };

  const getTiles = () =>
    [...document.querySelectorAll<SVGRectElement>("rect.stroke-white")].map((rect) => ({
      rect,
      area: Number(rect.getAttribute("width")) * Number(rect.getAttribute("height")),
    }));

  it("should size the tiles by cache size and darken the biggest shares", async () => {
    await setup({ "/big": 6000, "/medium": 3000, "/small": 1800, "/tiny": 0 });

    const { cachesStats, generalStats } = useCacheStatsStore.getState().applications.App;
    const shares = [...cachesStats.values()]
      .map((cache) => cache.generalStats.cacheSize / generalStats.cacheSize)
      .toSorted((a, b) => b - a);
    // One share in each band: over a half, over a quarter, over a sixth and below
    expect(shares[0]).toBeGreaterThan(1 / 2);
    expect(shares[1]).toBeWithin(1 / 4, 1 / 2);
    expect(shares[2]).toBeWithin(1 / 6, 1 / 4);
    expect(shares[3]).toBeLessThan(1 / 6);

    await waitFor(() => expect(getTiles()).toHaveLength(4));
    const fills = getTiles()
      .toSorted((a, b) => b.area - a.area)
      .map(({ rect }) => rect.style.fill);
    expect(new Set(fills).size).toBe(4);
    expect(fills).toStrictEqual(["#1234a4", "#1e40af", "#2c52cc", "#3374dd"]);
  });

  it("should label big tiles with their size and describe a tile on hover", async () => {
    const { view } = await setup({ "/users": 30_000, "/ping": 0 });
    const usersSize = [...useCacheStatsStore.getState().applications.App.cachesStats.values()].find(
      (cache) => cache.endpoint === "/users",
    )!.generalStats.cacheSize;

    await waitFor(() => expect(getTiles()).toHaveLength(2));
    const [biggest, smallest] = getTiles().toSorted((a, b) => b.area - a.area);
    // Only tiles big enough for a label show their size
    expect(biggest.rect.parentElement).toHaveTextContent(formatBytes(usersSize));
    expect(smallest.rect.parentElement).toHaveTextContent(/^$/);

    await view.user.hover(biggest.rect);

    const content = await waitFor(() => {
      const element = document.querySelector<HTMLElement>(
        "[data-slot='tooltip-content'], [data-side][data-state$='open']",
      );
      if (!element) {
        throw new Error("No tooltip");
      }
      return element;
    });
    // Radix repeats the content for screen readers, the first copy is the visible one
    const tooltip = within(content);
    expect(tooltip.getAllByText("/users")[0]).toBeVisible();
    expect(tooltip.getAllByText("Cache Size")[0].parentElement!.nextSibling).toHaveTextContent(formatBytes(usersSize));
    expect(tooltip.getAllByText("Total Entries")[0].parentElement!.nextSibling).toHaveTextContent("1");
  });
});

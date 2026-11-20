import { createResponseEvent } from "./stats.fixtures";
import { useCacheStatsStore } from "@/store/applications/cache-stats.store";
import { useMethodStatsStore } from "@/store/applications/method-stats.store";
import { useQueueStatsStore } from "@/store/applications/queue-stats.store";

describe("Method stats [ Store ]", () => {
  beforeEach(() => {
    useMethodStatsStore.setState(useMethodStatsStore.getInitialState(), true);
    useMethodStatsStore.getState().initialize("App");
  });

  const record = (options: Parameters<typeof createResponseEvent>[0]) =>
    useMethodStatsStore.getState().setMethodStats({ application: "App", data: createResponseEvent(options) });

  it("should aggregate requests per method", async () => {
    await record({ method: "GET", responseTime: 100 });
    await record({ method: "GET", responseTime: 300 });
    await record({ method: "POST", responseTime: 50 });

    const { methodsStats } = useMethodStatsStore.getState().applications.App;
    expect(methodsStats.get("GET")?.methodStats).toMatchObject({ totalRequests: 2, avgResponseTime: 200 });
    expect(methodsStats.get("POST")?.methodStats).toMatchObject({ totalRequests: 1, avgResponseTime: 50 });
  });

  it("should accumulate the error count per method", async () => {
    await record({ method: "GET", success: false });
    await record({ method: "GET", success: true });
    await record({ method: "GET", success: false });

    expect(useMethodStatsStore.getState().applications.App.methodsStats.get("GET")?.errorStats.count).toBe(2);
  });

  it("should aggregate all methods in the general stats", async () => {
    await record({ method: "GET" });
    await record({ method: "POST" });

    expect(useMethodStatsStore.getState().applications.App.generalStats.totalRequests).toBe(2);
  });
});

describe("Queue stats [ Store ]", () => {
  beforeEach(() => {
    useQueueStatsStore.setState(useQueueStatsStore.getInitialState(), true);
    useQueueStatsStore.getState().initialize("App");
  });

  const record = (options: Parameters<typeof createResponseEvent>[0]) =>
    useQueueStatsStore.getState().setQueueStats({ application: "App", data: createResponseEvent(options) });

  it("should aggregate per query key", async () => {
    await record({ endpoint: "/users/:id", params: { id: 1 }, responseTime: 100 });
    await record({ endpoint: "/users/:id", params: { id: 1 }, responseTime: 200 });
    await record({ endpoint: "/users/:id", params: { id: 2 }, responseTime: 400 });

    const { stats } = useQueueStatsStore.getState().applications.App;
    expect(stats.size).toBe(2);
    expect([...stats.values()].map((item) => item.totalRequests)).toStrictEqual([2, 1]);
    expect([...stats.values()][0].avgResponseTime).toBe(150);
  });

  it("should accumulate the error count per query key", async () => {
    await record({ success: false });
    await record({ success: false });

    const [errorStats] = [...useQueueStatsStore.getState().applications.App.errorStats.values()];
    expect(errorStats.count).toBe(2);
  });
});

describe("Cache stats [ Store ]", () => {
  beforeEach(() => {
    useCacheStatsStore.setState(useCacheStatsStore.getInitialState(), true);
    useCacheStatsStore.getState().initialize("App");
  });

  const record = (options: Parameters<typeof createResponseEvent>[0]) => {
    const data = createResponseEvent(options);
    return useCacheStatsStore
      .getState()
      .setCacheStats({ application: "App", data })
      .then(() => data);
  };

  it("should group cache entries of one endpoint template", async () => {
    await record({ endpoint: "/users/:id", params: { id: 1 } });
    await record({ endpoint: "/users/:id", params: { id: 2 } });

    const { cachesStats } = useCacheStatsStore.getState().applications.App;
    const stats = cachesStats.get("GET-/users/:id");
    expect(stats?.endpoint).toBe("/users/:id");
    expect(stats?.cacheEntries.size).toBe(2);
  });

  it("should replace an entry with the latest response of the same cache key", async () => {
    await record({ data: { value: "short" }, startedAt: 1000 });
    const latest = await record({ data: { value: "a much longer value" }, startedAt: 5000 });

    const stats = useCacheStatsStore.getState().applications.App.cachesStats.get("GET-/users");
    const [entry] = [...(stats?.cacheEntries.values() ?? [])];
    expect(stats?.cacheEntries.size).toBe(1);
    expect(entry.timestamp).toBe(latest.details.responseTimestamp);
    expect(stats?.generalStats.cacheSize).toBe(entry.stats.size);
  });

  it("should track not cached requests separately", async () => {
    await record({ endpoint: "/cached" });
    await record({ endpoint: "/live", cache: false });

    const app = useCacheStatsStore.getState().applications.App;
    const cached = app.cachesStats.get("GET-/cached");
    const live = app.cachesStats.get("GET-/live");

    expect(cached?.cacheEntries.size).toBe(1);
    expect(cached?.notCachedEntries.size).toBe(0);
    expect(live?.cacheEntries.size).toBe(0);
    expect(live?.notCachedEntries.size).toBe(1);
    expect(app.generalStats.cacheSize).toBe(cached?.generalStats.cacheSize);
    expect(app.generalStats.notCachedSize).toBe(live?.generalStats.notCachedSize);
    expect(app.generalStats.notCachedSize).toBeGreaterThan(0);
  });
});

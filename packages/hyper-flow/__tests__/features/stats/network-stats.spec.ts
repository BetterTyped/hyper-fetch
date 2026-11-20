import { createResponseEvent } from "./stats.fixtures";
import type { NetworkStats } from "@/store/applications/network-stats.store";
import {
  getNetworkStats,
  getPercentile,
  initialNetworkStats,
  RESPONSE_TIME_SAMPLE_SIZE,
  useNetworkStatsStore,
} from "@/store/applications/network-stats.store";
import { getDataSize } from "@/store/applications/utils";

const noSize = { responseSize: 0, payloadSize: 0 };

const accumulate = (events: ReturnType<typeof createResponseEvent>[], sizes = events.map(() => noSize)) => {
  return events.reduce<NetworkStats>((stats, event, index) => getNetworkStats(stats, event, sizes[index]), {
    ...initialNetworkStats,
  });
};

describe("Network stats [ Calculation ]", () => {
  it("should count requests by outcome and caching", () => {
    const stats = accumulate([
      createResponseEvent({ success: true, cache: true }),
      createResponseEvent({ success: false, cache: true }),
      createResponseEvent({ success: true, cache: false }),
    ]);

    expect(stats.totalRequests).toBe(3);
    expect(stats.totalRequestsSuccess).toBe(2);
    expect(stats.totalRequestsFailed).toBe(1);
    expect(stats.totalCachedRequests).toBe(2);
    expect(stats.totalNonCachedRequests).toBe(1);
  });

  it("should use the first value for every aggregate of a single request", () => {
    const stats = accumulate(
      [createResponseEvent({ responseTime: 120, processingTime: 30, queueTime: 15 })],
      [{ responseSize: 40, payloadSize: 10 }],
    );

    expect(stats).toMatchObject({
      avgResponseTime: 120,
      lowestResponseTime: 120,
      highestResponseTime: 120,
      latestResponseTime: 120,
      avgProcessingTime: 30,
      lowestProcessingTime: 30,
      highestProcessingTime: 30,
      avgQueueTime: 15,
      lowestQueueTime: 15,
      highestQueueTime: 15,
      avgResponseSize: 40,
      lowestResponseSize: 40,
      highestResponseSize: 40,
      avgPayloadSize: 10,
      lowestPayloadSize: 10,
      highestPayloadSize: 10,
    });
  });

  it("should compute the arithmetic mean over all requests", () => {
    // (100 + 200 + 600) / 3 = 300 - a pairwise "(prev + next) / 2" would give 375
    const stats = accumulate([
      createResponseEvent({ responseTime: 100 }),
      createResponseEvent({ responseTime: 200 }),
      createResponseEvent({ responseTime: 600 }),
    ]);

    expect(stats.avgResponseTime).toBe(300);
  });

  it("should track the lowest and highest values", () => {
    const stats = accumulate(
      [
        createResponseEvent({ responseTime: 300, queueTime: 4 }),
        createResponseEvent({ responseTime: 50, queueTime: 1 }),
        createResponseEvent({ responseTime: 900, queueTime: 9 }),
      ],
      [
        { responseSize: 30, payloadSize: 3 },
        { responseSize: 10, payloadSize: 1 },
        { responseSize: 90, payloadSize: 9 },
      ],
    );

    expect(stats.lowestResponseTime).toBe(50);
    expect(stats.highestResponseTime).toBe(900);
    expect(stats.latestResponseTime).toBe(900);
    expect(stats.lowestQueueTime).toBe(1);
    expect(stats.highestQueueTime).toBe(9);
    expect(stats.lowestResponseSize).toBe(10);
    expect(stats.highestResponseSize).toBe(90);
    expect(stats.lowestPayloadSize).toBe(1);
    expect(stats.highestPayloadSize).toBe(9);
  });

  it("should keep success and failure timings apart", () => {
    const stats = accumulate([
      createResponseEvent({ success: false, responseTime: 1000 }),
      createResponseEvent({ success: true, responseTime: 100 }),
      createResponseEvent({ success: true, responseTime: 300 }),
      createResponseEvent({ success: false, responseTime: 2000 }),
    ]);

    expect(stats.avgResponseTimeSuccess).toBe(200);
    expect(stats.lowestResponseTimeSuccess).toBe(100);
    expect(stats.highestResponseTimeSuccess).toBe(300);
    expect(stats.avgResponseTimeFailed).toBe(1_500);
    expect(stats.lowestResponseTimeFailed).toBe(1000);
    expect(stats.highestResponseTimeFailed).toBe(2000);
  });

  it("should leave success timings empty when only failures happened", () => {
    const stats = accumulate([createResponseEvent({ success: false, responseTime: 700 })]);

    expect(stats.avgResponseTimeSuccess).toBe(0);
    expect(stats.lowestResponseTimeSuccess).toBe(0);
    expect(stats.highestResponseTimeSuccess).toBe(0);
    expect(stats.avgResponseTimeFailed).toBe(700);
  });

  it("should sum the transferred sizes", () => {
    const stats = accumulate(
      [createResponseEvent(), createResponseEvent()],
      [
        { responseSize: 100, payloadSize: 7 },
        { responseSize: 50, payloadSize: 3 },
      ],
    );

    expect(stats.totalTransferredResponse).toBe(150);
    expect(stats.totalTransferredPayload).toBe(10);
    expect(stats.avgResponseSize).toBe(75);
    expect(stats.avgPayloadSize).toBe(5);
  });

  it("should not mutate the stats it starts from", () => {
    const before = { ...initialNetworkStats };
    getNetworkStats(initialNetworkStats, createResponseEvent(), noSize);
    expect(initialNetworkStats).toStrictEqual(before);
  });
});

describe("Network stats [ Store ]", () => {
  beforeEach(() => {
    useNetworkStatsStore.setState(useNetworkStatsStore.getInitialState(), true);
  });

  it("should aggregate per application and per endpoint template", async () => {
    useNetworkStatsStore.getState().initialize("App");

    await useNetworkStatsStore.getState().setNetworkStats({
      application: "App",
      data: createResponseEvent({ endpoint: "/users/:id", params: { id: 1 }, responseTime: 100 }),
    });
    await useNetworkStatsStore.getState().setNetworkStats({
      application: "App",
      data: createResponseEvent({ endpoint: "/users/:id", params: { id: 2 }, responseTime: 300 }),
    });
    await useNetworkStatsStore.getState().setNetworkStats({
      application: "App",
      data: createResponseEvent({ endpoint: "/posts", method: "POST", responseTime: 50 }),
    });

    const { networkStats, networkEntries } = useNetworkStatsStore.getState().applications.App;
    expect(networkStats.totalRequests).toBe(3);
    expect([...networkEntries.keys()]).toStrictEqual(["GET-/users/:id", "POST-/posts"]);
    expect(networkEntries.get("GET-/users/:id")).toMatchObject({
      endpoint: "/users/:id",
      method: "GET",
      stats: { totalRequests: 2, avgResponseTime: 200 },
    });
  });

  it("should keep applications apart", async () => {
    useNetworkStatsStore.getState().initialize("First");
    useNetworkStatsStore.getState().initialize("Second");

    await useNetworkStatsStore.getState().setNetworkStats({ application: "First", data: createResponseEvent() });

    expect(useNetworkStatsStore.getState().applications.First.networkStats.totalRequests).toBe(1);
    expect(useNetworkStatsStore.getState().applications.Second.networkStats.totalRequests).toBe(0);
  });

  it("should measure the payload size of the request", async () => {
    useNetworkStatsStore.getState().initialize("App");

    await useNetworkStatsStore.getState().setNetworkStats({
      application: "App",
      data: createResponseEvent({ method: "POST", payload: { name: "abc" } }),
    });

    // '{"name":"abc"}' is 14 bytes
    expect(useNetworkStatsStore.getState().applications.App.networkStats.totalTransferredPayload).toBe(14);
  });
});

describe("Data size [ Measurement ]", () => {
  it("should measure a missing body as empty", async () => {
    expect(await getDataSize(undefined)).toBe(0);
    expect(await getDataSize(null)).toBe(0);
  });

  it("should measure serialized values in bytes", async () => {
    expect(await getDataSize({ name: "abc" })).toBe(14);
    expect(await getDataSize("zażółć")).toBe(new TextEncoder().encode("zażółć").byteLength);
  });

  it("should measure blobs and form data", async () => {
    const form = new FormData();
    form.append("name", "abc");
    expect(await getDataSize(new Blob(["12345"]))).toBe(5);
    expect(await getDataSize(form)).toBe(7);
  });
});

describe("Response time percentiles", () => {
  beforeEach(() => {
    useNetworkStatsStore.setState(useNetworkStatsStore.getInitialState(), true);
    useNetworkStatsStore.getState().initialize("App");
  });

  it("should use the nearest rank", () => {
    const samples = Array.from({ length: 100 }, (_, index) => index + 1);
    expect(getPercentile(samples, 50)).toBe(50);
    expect(getPercentile(samples, 95)).toBe(95);
    expect(getPercentile(samples, 99)).toBe(99);
    expect(getPercentile(samples, 100)).toBe(100);
  });

  it("should not depend on the order of the samples", () => {
    expect(getPercentile([300, 100, 200], 50)).toBe(200);
    expect(getPercentile([300, 100, 200], 99)).toBe(300);
  });

  it("should handle no and single samples", () => {
    expect(getPercentile([], 95)).toBe(0);
    expect(getPercentile([42], 50)).toBe(42);
    expect(getPercentile([42], 99)).toBe(42);
  });

  it("should keep the response time of every request up to the sample size", async () => {
    await useNetworkStatsStore.getState().setNetworkStats({
      application: "App",
      data: createResponseEvent({ responseTime: 120 }),
    });
    await useNetworkStatsStore.getState().setNetworkStats({
      application: "App",
      data: createResponseEvent({ responseTime: 80 }),
    });

    expect(useNetworkStatsStore.getState().applications.App.responseTimeSamples).toStrictEqual([120, 80]);
  });

  it("should keep only the newest samples", async () => {
    for (let index = 0; index < RESPONSE_TIME_SAMPLE_SIZE + 5; index++) {
      // eslint-disable-next-line no-await-in-loop
      await useNetworkStatsStore.getState().setNetworkStats({
        application: "App",
        data: createResponseEvent({ responseTime: index }),
      });
    }

    const samples = useNetworkStatsStore.getState().applications.App.responseTimeSamples;
    expect(samples).toHaveLength(RESPONSE_TIME_SAMPLE_SIZE);
    expect(samples[0]).toBe(5);
    expect(samples.at(-1)).toBe(RESPONSE_TIME_SAMPLE_SIZE + 4);
  });
});

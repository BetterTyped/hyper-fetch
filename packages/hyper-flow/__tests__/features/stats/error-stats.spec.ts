import { createResponseEvent } from "./stats.fixtures";
import { getErrorStats, useErrorStatsStore } from "@/store/applications/error-stats.store";

describe("Error stats [ Calculation ]", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should count every failure", () => {
    const first = getErrorStats(createResponseEvent({ success: false, status: 500 }));
    const second = getErrorStats(createResponseEvent({ success: false, status: 500 }), first);
    const third = getErrorStats(createResponseEvent({ success: false, status: 500 }), second);

    expect(first.count).toBe(1);
    expect(second.count).toBe(2);
    expect(third.count).toBe(3);
  });

  it("should keep the first and the latest occurrence", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-01-01T10:00:00Z"));
    const first = getErrorStats(createResponseEvent({ success: false }));
    vi.setSystemTime(new Date("2026-01-01T11:00:00Z"));
    const second = getErrorStats(createResponseEvent({ success: false }), first);

    expect(second.firstOccurrence.toISOString()).toBe("2026-01-01T10:00:00.000Z");
    expect(second.lastOccurrence.toISOString()).toBe("2026-01-01T11:00:00.000Z");
  });

  it("should collect distinct error payloads", () => {
    const first = getErrorStats(createResponseEvent({ success: false, error: { message: "A" } }));
    const second = getErrorStats(createResponseEvent({ success: false, error: { message: "A" } }), first);
    const third = getErrorStats(createResponseEvent({ success: false, error: { message: "B" } }), second);

    expect(third.errors).toHaveLength(2);
  });

  it("should ignore successful responses", () => {
    const first = getErrorStats(createResponseEvent({ success: false }));
    const afterSuccess = getErrorStats(createResponseEvent({ success: true }), first);

    expect(afterSuccess).toStrictEqual(first);
    expect(getErrorStats(createResponseEvent({ success: true })).count).toBe(0);
  });
});

describe("Error stats [ Store ]", () => {
  beforeEach(() => {
    useErrorStatsStore.setState(useErrorStatsStore.getInitialState(), true);
    useErrorStatsStore.getState().initialize("App");
  });

  const record = (options: Parameters<typeof createResponseEvent>[0]) => {
    useErrorStatsStore.getState().setErrorStats({ application: "App", data: createResponseEvent(options) });
  };

  it("should group failures by status", () => {
    record({ success: false, status: 500 });
    record({ success: false, status: 500 });
    record({ success: false, status: 404 });

    const { statusErrorStats } = useErrorStatsStore.getState().applications.App;
    expect(statusErrorStats.get(500)?.count).toBe(2);
    expect(statusErrorStats.get(404)?.count).toBe(1);
  });

  it("should group failures by endpoint template and method", () => {
    record({ success: false, endpoint: "/users/:id", params: { id: 1 } });
    record({ success: false, endpoint: "/users/:id", params: { id: 2 } });
    record({ success: false, endpoint: "/users/:id", method: "DELETE", params: { id: 2 } });

    const { endpointErrorStats } = useErrorStatsStore.getState().applications.App;
    expect(endpointErrorStats.get("GET-/users/:id")).toMatchObject({ count: 2, endpoint: "/users/:id", method: "GET" });
    expect(endpointErrorStats.get("DELETE-/users/:id")).toMatchObject({ count: 1, method: "DELETE" });
  });
});

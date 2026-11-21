import type { DevtoolsSocketEventData } from "@hyper-fetch/plugin-devtools";
import { SocketEvents } from "@hyper-fetch/plugin-devtools";

import { resetElectronStore } from "../../vitest.setup";
import { createResponseEvent } from "../stats/stats.fixtures";
import { updateValue } from "@/components/json-viewer/json-viewer.utils";
import { useApplications } from "@/store/applications/apps.store";
import { useErrorStatsStore } from "@/store/applications/error-stats.store";
import { addCanceledRequest, getNetworkStats, initialNetworkStats } from "@/store/applications/network-stats.store";
import { useSocketsStore } from "@/store/applications/sockets.store";
import { getDataSize, toNumber } from "@/store/applications/utils";

describe("Sockets store [ Partial events ]", () => {
  const event = (overrides: Partial<DevtoolsSocketEventData> = {}): DevtoolsSocketEventData => ({
    socketId: "ws://chat",
    url: "ws://chat",
    adapterName: "websockets",
    timestamp: 1000,
    ...overrides,
  });

  beforeEach(() => {
    useSocketsStore.setState(useSocketsStore.getInitialState(), true);
    useSocketsStore.getState().initialize("App");
  });

  const handle = (name: SocketEvents, overrides: Partial<DevtoolsSocketEventData> = {}) =>
    useSocketsStore.getState().handleEvent("App", name, event(overrides));
  const app = () => useSocketsStore.getState().applications.App;
  const socket = () => app().sockets["ws://chat"];

  it("should keep the known status when a registration does not tell it", () => {
    handle(SocketEvents.CONNECTED, { timestamp: 2000 });

    handle(SocketEvents.REGISTERED, { url: "ws://chat?v=2" });

    expect(socket()).toMatchObject({ status: "connected", connectedAt: 2000, url: "ws://chat?v=2" });
  });

  it("should count reconnections itself when the attempts are not reported", () => {
    handle(SocketEvents.RECONNECTING);
    handle(SocketEvents.RECONNECTING);
    expect(socket().reconnectAttempts).toBe(2);
    expect(app().messages[0].attempts).toBe(2);

    handle(SocketEvents.RECONNECT_FAILED);

    expect(socket()).toMatchObject({ status: "failed", reconnectAttempts: 2 });
    expect(app().messages[0].attempts).toBeNull();
  });

  it("should count messages without a topic, but not as a topic", () => {
    handle(SocketEvents.MESSAGE_RECEIVED, { data: "ping" });
    handle(SocketEvents.MESSAGE_SENT, { data: { type: "pong" } });

    expect(socket()).toMatchObject({ received: 1, sent: 1, bytesReceived: 4, bytesSent: 15, topics: {} });
    expect(app().messages.map((message) => message.topic)).toStrictEqual([null, null]);
  });

  it("should log an event a newer plugin knows without changing the socket", () => {
    handle(SocketEvents.CONNECTED, { timestamp: 2000 });
    const before = socket();

    handle("SOCKET_PAUSED" as SocketEvents, { timestamp: 3000 });

    expect(socket()).toBe(before);
    expect(app().messages[0]).toMatchObject({ event: "SOCKET_PAUSED", kind: "connection", size: 0 });
  });

  it("should close the message details", () => {
    handle(SocketEvents.MESSAGE_RECEIVED, { data: "ping" });
    useSocketsStore.getState().openDetails("App", app().messages[0].id);

    useSocketsStore.getState().closeDetails("App");

    expect(app().detailsMessageId).toBeNull();
  });
});

describe("Stats [ Edge cases ]", () => {
  it("should count canceled requests apart from the finished ones", () => {
    const stats = addCanceledRequest(initialNetworkStats);

    expect(stats.totalRequestsCanceled).toBe(1);
    expect(stats.totalRequests).toBe(0);
    expect(getNetworkStats(stats, createResponseEvent(), { responseSize: 0, payloadSize: 0 }).totalRequestsCanceled).toBe(
      1,
    );
  });

  it("should group failures without a status under 0", () => {
    useErrorStatsStore.setState(useErrorStatsStore.getInitialState(), true);
    useErrorStatsStore.getState().initialize("App");
    // e.g. an adapter that could not reach the server at all
    const failure = createResponseEvent({ success: false });
    failure.response.status = null;

    useErrorStatsStore.getState().setErrorStats({ application: "App", data: failure });

    expect(useErrorStatsStore.getState().applications.App.statusErrorStats.get(0)).toMatchObject({
      count: 1,
      status: 0,
    });
  });

  it("should show ratios without requests as 0", () => {
    expect(toNumber(0 / 0)).toBe(0);
    expect(toNumber((1 / 4) * 100)).toBe(25);
  });

  it("should measure every value of a form, files included", async () => {
    const form = new FormData();
    form.append("avatar", new File(["12345"], "avatar.png"));
    form.append("name", "abc");

    // "avatar" + 5 bytes of the file + "name" + "abc"
    expect(await getDataSize(form)).toBe(6 + 5 + 4 + 3);
  });
});

describe("Applications store [ Persistence ]", () => {
  beforeEach(() => {
    resetElectronStore();
  });

  it("should keep applications in the electron store until it is cleared", async () => {
    useApplications.getState().addApplication({
      name: "Archived",
      environment: "test",
      adapterName: "http",
      url: "http://localhost",
      settings: { simulatedErrors: {}, maxRequestsHistorySize: 10 },
    });
    expect(window.electron.store.get("applications")).toContain("Archived");

    await useApplications.persist.clearStorage();

    expect(window.electron.store.get("applications")).toBeNull();
  });
});

describe("JSON viewer [ Root ]", () => {
  it("should leave the data as it is for the root itself", () => {
    // A tree with its root shown passes ["root"], which has no data keys left
    const data = { user: { name: "Maciej" } };

    expect(updateValue(data, [], "replaced")).toBe(data);
    expect(data).toStrictEqual({ user: { name: "Maciej" } });
  });
});

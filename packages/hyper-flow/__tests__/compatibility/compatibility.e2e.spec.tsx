import type { ClientInstance, QueueDataType, RequestInstance } from "@hyper-fetch/core";
import { getRequestDispatcher } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { screen, waitFor, within } from "@testing-library/react";

import { createHyperFlowEnv } from "../utils/hyper-flow";
import type { AdapterCase, User } from "./adapters";
import { adapterCases } from "./adapters";
import { useApplications } from "@/store/applications/apps.store";
import { useCacheStore } from "@/store/applications/cache.store";
import { useConnectionStore } from "@/store/applications/connection.store";
import { useErrorStatsStore } from "@/store/applications/error-stats.store";
import { useNetworkStatsStore } from "@/store/applications/network-stats.store";
import { useNetworkStore } from "@/store/applications/network.store";
import { getStatus, Status } from "@/utils/request.status.utils";

const { server, startServer, stopServer, resetMocks } = createHttpMockingServer();

const user: User = { id: 1, name: "Maciej" };

const getRequests = () => useNetworkStore.getState().applications.App?.requests ?? [];
const getMirror = () => useConnectionStore.getState().connections.App.client;
/** A JSON round trip, which is what reaches HyperFlow */
const asJson = (value: unknown): unknown => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

/**
 * Every HyperFlow flow, once per adapter. `pnpm test:compatibility` turns the results into the compatibility table.
 */
describe.each(adapterCases)("Compatibility [ $name ]", (adapter: AdapterCase) => {
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

  const setup = async () => {
    const client = adapter.createClient();
    const { plugin } = env.connectApp({ client });
    const view = env.renderApp();
    await env.waitForApp(plugin);
    const read = adapter.createRead(client, user.id);
    const write = adapter.createWrite(client);
    return { client, view, read, write };
  };

  const sendRead = async (read: RequestInstance) => {
    adapter.replyRead(server, user);
    const response = await read.send();
    expect(response.success).toBeTrue();
    await waitFor(() => expect(getRequests().find((item) => item.isFinished)).toBeDefined());
    return response;
  };

  it("connects and reports its adapter", async () => {
    await setup();

    expect(useApplications.getState().applications.App.adapterName).toBe(adapter.adapterName);
    expect(getMirror().adapter.name).toBe(adapter.adapterName);
  });

  it("lists successful requests with the data the app received", async () => {
    const { read } = await setup();

    const response = await sendRead(read);

    const [item] = getRequests();
    expect(getStatus(item)).toBe(Status.SUCCESS);
    expect(item.request.method).toBe(read.method);
    expect(item.response?.data).toStrictEqual(asJson(response.data));
    expect(item.response?.status).toStrictEqual(response.status);
  });

  it("lists failed requests with the error the app received", async () => {
    const { write } = await setup();
    adapter.failWrite(server, "Invalid name");

    const response = await write.send({ payload: adapter.writePayload } as never);

    expect(response.success).toBeFalse();
    await waitFor(() => expect(getRequests()[0]?.isFinished).toBeTrue());
    const [item] = getRequests();
    expect(getStatus(item)).toBe(Status.FAILED);
    expect(item.response?.status).toBe(adapter.failedStatus);
    expect(item.response?.error).toStrictEqual(asJson(response.error));
  });

  it("marks aborted requests as canceled", async () => {
    const { client, read } = await setup();
    adapter.replyRead(server, user, { delay: 2_000 });
    const unmount = client.requestManager.events.onRequestStart(() => {
      unmount();
      read.abort();
    });

    await read.send();

    await waitFor(() => expect(getRequests()[0]?.isCanceled).toBeTrue());
    expect(getStatus(getRequests()[0])).toBe(Status.CANCELED);
  });

  it("collects statistics", async () => {
    const { read, write } = await setup();
    adapter.failWrite(server, "Invalid name");

    await sendRead(read);
    await write.send({ payload: adapter.writePayload } as never);

    await waitFor(() => {
      expect(useNetworkStatsStore.getState().applications.App.networkStats).toMatchObject({
        totalRequests: 2,
        totalRequestsSuccess: 1,
        totalRequestsFailed: 1,
      });
    });
    expect(useNetworkStatsStore.getState().applications.App.networkEntries.size).toBe(2);
    expect(useErrorStatsStore.getState().applications.App.statusErrorStats.get(adapter.failedStatus)?.count).toBe(1);
  });

  it("shows requests in the network list", async () => {
    const { read, view } = await setup();
    await sendRead(read);

    await view.navigate("/applications/App/network");

    const label = await screen.findByText(adapter.readLabel(user.id));
    const row = label.closest("tr")!;
    expect(within(row).getByText(read.method)).toBeInTheDocument();
    await view.user.click(row);
    expect(await screen.findByText("/ Details", { exact: false })).toBeInTheDocument();
  });

  it("lists cached responses", async () => {
    const { read } = await setup();

    const response = await sendRead(read);

    await waitFor(() => {
      const cached = useCacheStore.getState().applications.App.caches.get(read.cacheKey);
      expect(cached?.cacheData.data).toStrictEqual(asJson(response.data));
    });
  });

  it("removes cache entries from the app", async () => {
    const { client, read } = await setup();
    await sendRead(read);
    await waitFor(() => expect(useCacheStore.getState().applications.App.caches.has(read.cacheKey)).toBeTrue());

    // What the Remove action does
    getMirror().cache.events.emitDelete(read.cacheKey, true);

    await waitFor(() => expect(client.cache.get(read.cacheKey)).toBeUndefined());
  });

  it("invalidates cache entries in the app", async () => {
    const { client, read } = await setup();
    await sendRead(read);
    await waitFor(() => expect(useCacheStore.getState().applications.App.caches.has(read.cacheKey)).toBeTrue());

    // What the Invalidate action does
    getMirror().cache.events.emitInvalidation(read.cacheKey, true);

    await waitFor(() => expect(client.cache.get(read.cacheKey)?.staleTime).toBe(0));
  });

  it("stops and starts the app's queues", async () => {
    const { client, read } = await setup();
    adapter.replyRead(server, user);
    const [userDispatcher] = getRequestDispatcher(read);
    const isFetch = userDispatcher === client.fetchDispatcher;
    const mirrorDispatcher = isFetch ? getMirror().fetchDispatcher : getMirror().submitDispatcher;
    const queue: QueueDataType = { queryKey: read.queryKey, requests: [], stopped: true };

    // What the Stop and Start actions do
    mirrorDispatcher.events.emitQueueStatusChanged(queue, true);
    await waitFor(() => expect(userDispatcher.getQueue(read.queryKey).stopped).toBeTrue());

    const sent = read.send();
    await waitFor(() => expect(getStatus(getRequests()[0] ?? { isRemoved: false, isCanceled: false, isFinished: false, isSuccess: false })).toBe(Status.PAUSED));

    mirrorDispatcher.events.emitQueueStatusChanged({ ...queue, stopped: false }, true);
    expect((await sent).success).toBeTrue();
    await waitFor(() => expect(getStatus(getRequests()[0])).toBe(Status.SUCCESS));
  });
});

/** Keeps the matrix honest: every case must be a different adapter */
it("covers distinct adapters", () => {
  const names = adapterCases.map((item) => item.adapterName);
  expect(new Set(names).size).toBe(names.length);
  const clients: ClientInstance[] = adapterCases.map((item) => item.createClient());
  expect(clients.every((client) => !!client.adapter)).toBeTrue();
});

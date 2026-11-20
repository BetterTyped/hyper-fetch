import { createClient } from "@hyper-fetch/core";
import { createHttpMockingServer, sleep } from "@hyper-fetch/testing";
import { act, screen, waitFor, within } from "@testing-library/react";

import { createHyperFlowEnv } from "../../utils/hyper-flow";
import { useApplications } from "@/store/applications/apps.store";
import { useNetworkStatsStore } from "@/store/applications/network-stats.store";
import { useNetworkStore } from "@/store/applications/network.store";
import { useQueueStatsStore } from "@/store/applications/queue-stats.store";
import { getStatus, Status } from "@/utils/request.status.utils";

const { startServer, stopServer, resetMocks, mockRequest } = createHttpMockingServer();

describe("Network [ E2E ]", () => {
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
    const client = createClient({ url: "http://localhost:5000" });
    const { plugin } = env.connectApp({ client });
    const getUsers = client.createRequest<{ response: { id: number }[]; error: { message: string } }>()({
      endpoint: "/users",
    });
    const getUser = client.createRequest<{ response: { id: number } }>()({ endpoint: "/users/:id" });
    const postUser = client.createRequest<{ response: { id: number }; payload: { name: string } }>()({
      endpoint: "/users",
      method: "POST",
    });

    const view = env.renderApp();
    await env.waitForApp(plugin);
    await view.navigate("/applications/App/network");

    return { client, plugin, getUsers, getUser, postUser, view };
  };

  it("should show the empty state before any request is sent", async () => {
    await setup();
    expect(await screen.findByText("Network is empty")).toBeInTheDocument();
  });

  it("should list a successful request with its method and endpoint", async () => {
    const { getUsers } = await setup();
    mockRequest(getUsers, { data: [{ id: 1 }] });

    await getUsers.send();

    const row = await screen.findByText("/users");
    expect(row).toBeInTheDocument();
    expect(within(row.closest("tr")!).getByText("GET")).toBeInTheDocument();
  });

  it("should store requests and finish them with the response details", async () => {
    const { getUsers } = await setup();
    mockRequest(getUsers, { data: [{ id: 1 }] });

    const response = await getUsers.send();

    await waitFor(() => {
      const [item] = useNetworkStore.getState().applications.App.requests;
      expect(item.isFinished).toBeTrue();
      expect(item.isSuccess).toBeTrue();
      expect(item.response?.data).toStrictEqual(response.data);
      expect(item.request.endpoint).toBe("/users");
    });
  });

  it("should mark failed requests as failed", async () => {
    const { getUsers } = await setup();
    mockRequest(getUsers, { status: 500, error: { message: "Boom" } });

    await getUsers.send();

    await waitFor(() => {
      const [item] = useNetworkStore.getState().applications.App.requests;
      expect(item.isFinished).toBeTrue();
      expect(item.isSuccess).toBeFalse();
      expect(item.response?.error).toStrictEqual({ message: "Boom" });
    });
  });

  it("should keep aborted requests canceled", async () => {
    const { client, getUsers, getUser } = await setup();
    mockRequest(getUsers, { data: [], delay: 1000 });
    mockRequest(getUser, { data: { id: 1 } });
    // Abort while the request is surely in flight in the user's app
    const unmount = client.requestManager.events.onRequestStart(() => {
      unmount();
      getUsers.abort();
    });

    await getUsers.send();
    // Events arrive in order, so once a later request is listed as finished the aborted one got all its events
    await getUser.send({ params: { id: 1 } });
    await waitFor(() => {
      expect(useNetworkStore.getState().applications.App.requests[0].isFinished).toBeTrue();
    });

    const aborted = useNetworkStore.getState().applications.App.requests[1];
    expect(aborted.request.endpoint).toBe("/users");
    expect(aborted.isCanceled).toBeTrue();
    expect(aborted.isFinished).toBeFalse();
    expect(getStatus(aborted)).toBe(Status.CANCELED);
  });

  it("should count aborted requests as canceled in the network and queue stats", async () => {
    const { client, getUsers, getUser } = await setup();
    mockRequest(getUsers, { data: [], delay: 1000 });
    mockRequest(getUser, { data: { id: 1 } });
    const unmount = client.requestManager.events.onRequestStart(() => {
      unmount();
      getUsers.abort();
    });

    await getUsers.send();
    await getUser.send({ params: { id: 1 } });
    await waitFor(() => {
      expect(useNetworkStore.getState().applications.App.requests[0].isFinished).toBeTrue();
    });

    const { networkStats } = useNetworkStatsStore.getState().applications.App;
    expect(networkStats.totalRequestsCanceled).toBe(1);
    // A canceled request never finished, so it is not one of the finished ones
    expect(networkStats.totalRequests).toBe(1);
    expect(useQueueStatsStore.getState().applications.App.stats.get(getUsers.queryKey)?.totalRequestsCanceled).toBe(1);
  });

  it("should mark requests removed from the queue before they were sent", async () => {
    const { client, getUsers, getUser } = await setup();
    mockRequest(getUsers, { data: [] });
    mockRequest(getUser, { data: { id: 1 } });
    client.fetchDispatcher.stop(getUsers.queryKey);

    void getUsers.send();
    await waitFor(() => expect(client.fetchDispatcher.getQueue(getUsers.queryKey).requests).toHaveLength(1));
    const [queued] = client.fetchDispatcher.getQueue(getUsers.queryKey).requests;
    client.fetchDispatcher.delete(getUsers.queryKey, queued.requestId, getUsers.abortKey);

    await getUser.send({ params: { id: 1 } });
    await waitFor(() => {
      const requests = useNetworkStore.getState().applications.App.requests;
      expect(requests.find((item) => item.request.endpoint === "/users/1")?.isFinished).toBeTrue();
    });
    const removed = useNetworkStore
      .getState()
      .applications.App.requests.find((item) => item.request.endpoint === "/users");
    expect(removed?.isRemoved).toBeTrue();
    expect(getStatus(removed!)).toBe(Status.REMOVED);
  });

  it("should list many requests newest first", async () => {
    const { getUsers, getUser, postUser } = await setup();
    mockRequest(getUsers, { data: [] });
    mockRequest(getUser, { data: { id: 1 } });
    mockRequest(postUser, { data: { id: 2 } });

    await getUsers.send();
    await getUser.send({ params: { id: 1 } });
    await postUser.send({ payload: { name: "Maciej" } });

    await waitFor(() => {
      const requests = useNetworkStore.getState().applications.App.requests;
      expect(requests.map((item) => `${item.request.method} ${item.request.endpoint}`)).toStrictEqual([
        "POST /users",
        "GET /users/1",
        "GET /users",
      ]);
      expect(requests.every((item) => item.isFinished)).toBeTrue();
    });
  });

  it("should keep listing requests after the page settles", async () => {
    const { getUsers } = await setup();
    mockRequest(getUsers, { data: [] });
    await getUsers.send();
    expect(await screen.findByText("/users")).toBeInTheDocument();

    // The list used to be replaced by a stale empty snapshot after a 200ms debounce
    await act(async () => {
      await sleep(300);
    });

    expect(screen.getByText("/users")).toBeInTheDocument();
    expect(screen.queryByText("Network is empty")).not.toBeInTheDocument();
  });

  it("should filter the list by the search term", async () => {
    const { getUsers, postUser } = await setup();
    mockRequest(getUsers, { data: [] });
    mockRequest(postUser, { data: { id: 1 } });
    await getUsers.send();
    await postUser.send({ payload: { name: "Maciej" } });
    await waitFor(() => expect(screen.getAllByText("/users")).toHaveLength(2));

    act(() => {
      useNetworkStore.getState().setNetworkSearchTerm({ application: "App", searchTerm: "POST" });
    });

    await waitFor(() => expect(screen.getAllByText("/users")).toHaveLength(1));
    expect(within(screen.getByText("/users").closest("tr")!).getByText("POST")).toBeInTheDocument();
  });

  it("should sort the list by endpoint", async () => {
    const { getUsers, getUser, view } = await setup();
    mockRequest(getUsers, { data: [] });
    mockRequest(getUser, { data: { id: 1 } });
    await getUser.send({ params: { id: 1 } });
    await getUsers.send();
    await waitFor(() => expect(screen.getByText("/users/1")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("/users")).toBeInTheDocument());

    await view.user.click(screen.getByText("Endpoint"));

    await waitFor(() => {
      const endpoints = screen.getAllByText(/^\/users/).map((element) => element.textContent);
      expect(endpoints).toStrictEqual(["/users", "/users/1"]);
    });
  });

  it("should keep only the newest requests up to the history size", async () => {
    const { getUser } = await setup();
    mockRequest(getUser, { data: { id: 1 } });
    act(() => {
      useApplications.getState().setSettings("App", { maxRequestsHistorySize: 2 });
    });

    await getUser.send({ params: { id: 1 } });
    await getUser.send({ params: { id: 2 } });
    await getUser.send({ params: { id: 3 } });

    await waitFor(() => {
      const requests = useNetworkStore.getState().applications.App.requests;
      expect(requests.map((item) => item.request.endpoint)).toStrictEqual(["/users/3", "/users/2"]);
      expect(requests.every((item) => item.isFinished)).toBeTrue();
    });
  });

  it("should show paused requests of a stopped queue and send them once started", async () => {
    const { client, getUsers } = await setup();
    mockRequest(getUsers, { data: [{ id: 1 }] });
    client.fetchDispatcher.stop(getUsers.queryKey);

    const promise = getUsers.send();
    await waitFor(() => {
      const [item] = useNetworkStore.getState().applications.App.requests;
      expect(item && getStatus(item)).toBe(Status.PAUSED);
    });

    client.fetchDispatcher.start(getUsers.queryKey);
    await promise;

    await waitFor(() => {
      const [item] = useNetworkStore.getState().applications.App.requests;
      expect(getStatus(item)).toBe(Status.SUCCESS);
      expect(item.isPaused).toBeFalse();
    });
  });

  it("should open and close the request details", async () => {
    const { getUsers, view } = await setup();
    mockRequest(getUsers, { data: [{ id: 1 }] });
    await getUsers.send();

    const row = await screen.findByText("/users");
    await view.user.click(row);

    expect(await screen.findByText("/ Details", { exact: false })).toBeInTheDocument();
  });
});

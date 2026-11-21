import { createClient } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { screen, waitFor, within } from "@testing-library/react";

import { createHold } from "../../utils/hold";
import { createHyperFlowEnv } from "../../utils/hyper-flow";
import { useQueueStore } from "@/store/applications/queue.store";

const { startServer, stopServer, resetMocks, mockRequest } = createHttpMockingServer();

type User = { id: number; name: string };

describe("Queues [ E2E ]", () => {
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
    const getUsers = client.createRequest<{ response: User[] }>()({ endpoint: "/users" });
    const postUser = client.createRequest<{ response: User; payload: { name: string } }>()({
      endpoint: "/users",
      method: "POST",
    });

    const view = env.renderApp();
    await env.waitForApp(plugin);
    await view.navigate("/applications/App/queues");

    return { client, plugin, getUsers, postUser, view };
  };

  /** The query key is also shown in the details header, so only keys inside list cards count. */
  const queryCard = (queryKey: string) => {
    const cards = screen.queryAllByText(queryKey).map((key) => key.closest<HTMLElement>("[role=button]"));
    return cards.find((card) => !!card) ?? null;
  };

  const getCard = (queryKey: string) =>
    waitFor(() => {
      const card = queryCard(queryKey);
      if (!card) {
        throw new Error(`No queue card for ${queryKey}`);
      }
      return card;
    });

  const expectCard = (queryKey: string, { status, active }: { status: string; active: number }) =>
    waitFor(() => {
      const card = queryCard(queryKey);
      if (!card) {
        throw new Error(`No queue card for ${queryKey}`);
      }
      // Card reads "<queryKey><status><active>Active request(s)(<total> in total)"
      expect(card.textContent).toContain(`${queryKey}${status}${active}Active request`);
    });

  const clickAction = async (view: Awaited<ReturnType<typeof setup>>["view"], action: string | RegExp) => {
    await view.user.click(await screen.findByRole("button", { name: /Actions/ }));
    await view.user.click(await screen.findByRole("menuitem", { name: action }));
  };

  const openDetails = async (view: Awaited<ReturnType<typeof setup>>["view"], queryKey: string) => {
    await view.user.click(await getCard(queryKey));
    expect(await screen.findByText("/ Details", { exact: false })).toBeInTheDocument();
  };

  describe("When listing queues", () => {
    it("should show the empty state before any request is sent", async () => {
      await setup();
      expect(await screen.findByText("No active queues")).toBeInTheDocument();
    });

    it("should show a running fetch queue while the request is in flight and empty it when done", async () => {
      const { getUsers } = await setup();
      const { until, release } = createHold();
      mockRequest(getUsers, { data: [], until });

      const promise = getUsers.send();

      await expectCard(getUsers.queryKey, { status: "Running", active: 1 });
      release();
      await promise;
      await expectCard(getUsers.queryKey, { status: "Pending", active: 0 });
      expect(useQueueStore.getState().applications.App.queues.get(getUsers.queryKey)?.requests).toHaveLength(0);
    });

    it("should show a running submit queue while the request is in flight", async () => {
      const { postUser } = await setup();
      const { until, release } = createHold();
      mockRequest(postUser, { data: { id: 1, name: "Maciej" }, until });

      const promise = postUser.send({ payload: { name: "Maciej" } });

      await expectCard(postUser.queryKey, { status: "Running", active: 1 });
      release();
      await promise;
      await expectCard(postUser.queryKey, { status: "Pending", active: 0 });
    });

    it("should count every request waiting in the same queue", async () => {
      const { getUsers } = await setup();
      // Queued requests wait for each other, so the second one stays in the queue behind the first
      const queued = getUsers.setQueued(true);
      const { until, release } = createHold();
      mockRequest(queued, { data: [], until });
      const first = queued.send();
      const second = queued.send();

      await expectCard(getUsers.queryKey, { status: "Running", active: 2 });
      release();
      await Promise.all([first, second]);
      await expectCard(getUsers.queryKey, { status: "Pending", active: 0 });
    });

    it("should keep the list up to date after the page settles", async () => {
      const { getUsers, postUser } = await setup();
      mockRequest(getUsers, { data: [] });
      // Keeps the test running past the list's former 200ms search debounce, which swapped the list back to
      // the stale copy taken on mount
      mockRequest(postUser, { data: { id: 1, name: "Maciej" }, delay: 400 });

      await getUsers.send();
      await expectCard(getUsers.queryKey, { status: "Pending", active: 0 });
      await postUser.send({ payload: { name: "Maciej" } });

      expect(queryCard(getUsers.queryKey)).not.toBeNull();
      expect(queryCard(postUser.queryKey)).not.toBeNull();
      expect(screen.queryByText("No active queues")).not.toBeInTheDocument();
    });

    it("should filter the list by the search term", async () => {
      const { getUsers, postUser } = await setup();
      mockRequest(getUsers, { data: [] });
      mockRequest(postUser, { data: { id: 1, name: "Maciej" } });
      await getUsers.send();
      await postUser.send({ payload: { name: "Maciej" } });
      await getCard(postUser.queryKey);

      useQueueStore.getState().setSearchTerm("App", "POST");

      await waitFor(() => {
        expect(queryCard(getUsers.queryKey)).toBeNull();
      });
      expect(queryCard(postUser.queryKey)).not.toBeNull();
    });

    it("should show a queue stopped in the user application as stopped", async () => {
      const { client, getUsers } = await setup();
      mockRequest(getUsers, { data: [] });
      await getUsers.send();
      await expectCard(getUsers.queryKey, { status: "Pending", active: 0 });

      client.fetchDispatcher.stop(getUsers.queryKey);

      await expectCard(getUsers.queryKey, { status: "Stopped", active: 0 });
    });
  });

  describe("When inspecting a queue", () => {
    it("should open the details with the queue status and close them", async () => {
      const { getUsers, view } = await setup();
      mockRequest(getUsers, { data: [] });
      await getUsers.send();

      await openDetails(view, getUsers.queryKey);

      expect(useQueueStore.getState().applications.App.detailsId).toBe(getUsers.queryKey);
      expect(screen.getByText("Pending Requests:")).toBeInTheDocument();
      expect(screen.getAllByText(getUsers.queryKey).length).toBeGreaterThan(1);

      const toolbar = screen.getByText("/ Details", { exact: false }).parentElement as HTMLElement;
      await view.user.click(within(toolbar).getAllByRole("button")[0]);

      await waitFor(() => {
        expect(screen.queryByText("/ Details", { exact: false })).not.toBeInTheDocument();
      });
      expect(useQueueStore.getState().applications.App.detailsId).toBeNull();
    });
  });

  describe("When acting on a queue from HyperFlow", () => {
    it("should stop and start the fetch queue of the user application", async () => {
      const { client, getUsers, view } = await setup();
      mockRequest(getUsers, { data: [] });
      await getUsers.send();
      await openDetails(view, getUsers.queryKey);

      await clickAction(view, "Stop");

      await waitFor(() => {
        expect(client.fetchDispatcher.getQueue(getUsers.queryKey).stopped).toBeTrue();
      });
      await expectCard(getUsers.queryKey, { status: "Stopped", active: 0 });

      // Stopped queue holds the request back
      const onRequestStart = vi.fn();
      client.requestManager.events.onRequestStart(onRequestStart);
      const promise = getUsers.send();
      await expectCard(getUsers.queryKey, { status: "Stopped", active: 1 });
      expect(onRequestStart).not.toHaveBeenCalled();

      await clickAction(view, "Start");

      await waitFor(() => {
        expect(client.fetchDispatcher.getQueue(getUsers.queryKey).stopped).toBeFalse();
      });
      const response = await promise;
      expect(response.success).toBeTrue();
      expect(onRequestStart).toHaveBeenCalledTimes(1);
      await expectCard(getUsers.queryKey, { status: "Pending", active: 0 });
    });

    it("should stop the submit queue of the user application", async () => {
      const { client, postUser, view } = await setup();
      mockRequest(postUser, { data: { id: 1, name: "Maciej" } });
      await postUser.send({ payload: { name: "Maciej" } });
      await openDetails(view, postUser.queryKey);

      await clickAction(view, "Stop");

      await waitFor(() => {
        expect(client.submitDispatcher.getQueue(postUser.queryKey).stopped).toBeTrue();
      });
      expect(client.fetchDispatcher.getQueue(postUser.queryKey).stopped).toBeFalse();
    });

    it("should control the dispatcher of a request with a custom query key", async () => {
      const { client, view } = await setup();
      const getUsers = client.createRequest<{ response: User[] }>()({ endpoint: "/users", queryKey: "users-list" });
      mockRequest(getUsers, { data: [] });
      await getUsers.send();
      await openDetails(view, "users-list");

      await clickAction(view, "Stop");

      await waitFor(() => {
        expect(client.fetchDispatcher.getQueue("users-list").stopped).toBeTrue();
      });
      expect(client.submitDispatcher.getQueue("users-list").stopped).toBeFalse();
    });

    it("should show a queue stopped in the user application as startable", async () => {
      const { client, getUsers, view } = await setup();
      mockRequest(getUsers, { data: [] });
      await getUsers.send();
      await openDetails(view, getUsers.queryKey);

      client.fetchDispatcher.stop(getUsers.queryKey);
      await expectCard(getUsers.queryKey, { status: "Stopped", active: 0 });

      await clickAction(view, "Start");

      await waitFor(() => {
        expect(client.fetchDispatcher.getQueue(getUsers.queryKey).stopped).toBeFalse();
      });
    });

    it("should clear the queue of the user application", async () => {
      const { client, getUsers, view } = await setup();
      mockRequest(getUsers, { data: [] });
      await getUsers.send();
      client.fetchDispatcher.stop(getUsers.queryKey);
      const promise = getUsers.send();
      await expectCard(getUsers.queryKey, { status: "Stopped", active: 1 });
      expect(client.fetchDispatcher.getQueue(getUsers.queryKey).requests).toHaveLength(1);
      await openDetails(view, getUsers.queryKey);

      await clickAction(view, "Clear");

      await waitFor(() => {
        expect(client.fetchDispatcher.getQueue(getUsers.queryKey).requests).toHaveLength(0);
      });
      const response = await promise;
      expect(response.success).toBeFalse();
      await expectCard(getUsers.queryKey, { status: "Stopped", active: 0 });
    });

    it("should set and restore the loading state in the user application", async () => {
      const { client, getUsers, view } = await setup();
      mockRequest(getUsers, { data: [] });
      await getUsers.send();
      await openDetails(view, getUsers.queryKey);
      const onLoading = vi.fn();
      client.requestManager.events.onLoading(onLoading);

      await clickAction(view, "Set loading");

      await waitFor(() => {
        expect(onLoading).toHaveBeenCalledTimes(1);
      });
      expect(onLoading.mock.calls[0][0]).toMatchObject({ loading: true });
      expect(onLoading.mock.calls[0][0].request.queryKey).toBe(getUsers.queryKey);
      expect(useQueueStore.getState().applications.App.loadingKeys.has(getUsers.queryKey)).toBeTrue();

      await clickAction(view, "Restore loading");

      await waitFor(() => {
        expect(onLoading).toHaveBeenCalledTimes(2);
      });
      expect(onLoading.mock.calls[1][0]).toMatchObject({ loading: false });
      expect(useQueueStore.getState().applications.App.loadingKeys.has(getUsers.queryKey)).toBeFalse();
    });
  });
});

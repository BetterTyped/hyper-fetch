import { createClient } from "@hyper-fetch/core";
import { useFetch } from "@hyper-fetch/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { renderHook, screen, waitFor, within } from "@testing-library/react";

import { createHyperFlowEnv } from "../../utils/hyper-flow";
import { useNetworkStore } from "@/store/applications/network.store";

const { startServer, stopServer, resetMocks, mockRequest } = createHttpMockingServer();

type User = { id: number; name: string };

describe("Queues [ Details ]", () => {
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
    const getUsers = client.createRequest<{ response: User[]; error: { message: string } }>()({ endpoint: "/users" });
    const postUser = client.createRequest<{ response: User; payload: { name: string } }>()({
      endpoint: "/users",
      method: "POST",
    });

    const view = env.renderApp();
    await env.waitForApp(plugin);
    await view.navigate("/applications/App/queues");

    return { client, plugin, getUsers, postUser, view };
  };

  type View = Awaited<ReturnType<typeof setup>>["view"];

  /** The query key is also shown in the details header, so only keys inside list cards count. */
  const getCard = (queryKey: string) =>
    waitFor(() => {
      const card = screen
        .queryAllByText(queryKey)
        .map((key) => key.closest<HTMLElement>("[role=button]"))
        .find((element) => !!element);
      if (!card) {
        throw new Error(`No queue card for ${queryKey}`);
      }
      return card;
    });

  const openDetails = async (view: View, queryKey: string) => {
    await view.user.click(await getCard(queryKey));
    expect(await screen.findByText("/ Details", { exact: false })).toBeInTheDocument();
  };

  const clickAction = async (view: View, action: string | RegExp) => {
    await view.user.click(await screen.findByRole("button", { name: /Actions/ }));
    await view.user.click(await screen.findByRole("menuitem", { name: action }));
  };

  const getOverviewValue = (label: string) => screen.getByText(label).closest("tr")!.querySelectorAll("td")[1];

  /** Empties the network list through the network page, like a user cleaning up before inspecting a queue. */
  const clearNetwork = async (view: View) => {
    await view.navigate("/applications/App/network");
    await view.user.click(await screen.findByRole("button", { name: /Clear network/ }));
    expect(await screen.findByText("Network is empty")).toBeInTheDocument();
    await view.navigate("/applications/App/queues");
  };

  describe("When components of the app use the query key", () => {
    it("should show how many observe the queue", async () => {
      const { getUsers, view } = await setup();
      mockRequest(getUsers, { data: [] });

      const first = renderHook(() => useFetch(getUsers));
      const second = renderHook(() => useFetch(getUsers));
      await waitFor(() => expect(first.result.current.data).toStrictEqual([]));
      await openDetails(view, getUsers.queryKey);

      await waitFor(() => expect(getOverviewValue("Observers:")).toHaveTextContent("2"));

      second.unmount();

      await waitFor(() => expect(getOverviewValue("Observers:")).toHaveTextContent("1"));
      first.unmount();
      await waitFor(() => expect(getOverviewValue("Observers:")).toHaveTextContent("0"));
    });
  });

  describe("When the queue has no finished request yet", () => {
    it("should count zero processed requests and show the stats once the first one finishes", async () => {
      const { client, getUsers, view } = await setup();
      mockRequest(getUsers, { data: [] });
      // A stopped queue holds the request back, so it stays unfinished for as long as the test needs
      client.fetchDispatcher.stop(getUsers.queryKey);

      const promise = getUsers.send();
      await openDetails(view, getUsers.queryKey);

      expect(getOverviewValue("Processed Requests:")).toHaveTextContent("0 requests");
      expect(getOverviewValue("Successful Requests:")).toHaveTextContent("0 requests");
      expect(getOverviewValue("Pending Requests:")).toHaveTextContent("1 request");
      expect(screen.queryByText("Request Overview")).not.toBeInTheDocument();

      client.fetchDispatcher.start(getUsers.queryKey);
      await promise;

      expect(await screen.findByText("Request Overview")).toBeInTheDocument();
      await waitFor(() => {
        expect(getOverviewValue("Processed Requests:")).toHaveTextContent("1 request");
      });
      expect(getOverviewValue("Successful Requests:")).toHaveTextContent("1 request");
      expect(getOverviewValue("Pending Requests:")).toHaveTextContent("0 requests");
      const overview = within(screen.getByText("Request Overview").parentElement!);
      expect(overview.getByText("Total Requests").nextSibling).toHaveTextContent("1");
      expect(overview.getByText("Success Rate").nextSibling).toHaveTextContent("100%");
    });
  });

  describe("When requests fail", () => {
    it("should count failed requests apart from successful ones", async () => {
      const { getUsers, view } = await setup();
      mockRequest(getUsers, { status: 500, error: { message: "Boom" } });

      await getUsers.send();
      await openDetails(view, getUsers.queryKey);

      await waitFor(() => {
        expect(getOverviewValue("Failed Requests:")).toHaveTextContent("1 request");
      });
      expect(getOverviewValue("Successful Requests:")).toHaveTextContent("0 requests");
      expect(getOverviewValue("Processed Requests:")).toHaveTextContent("1 request");
    });
  });

  describe("When a request is aborted", () => {
    it("should count it as canceled without a success rate of nothing", async () => {
      const { client, getUsers, view } = await setup();
      mockRequest(getUsers, { data: [], delay: 1000 });
      const unmount = client.requestManager.events.onRequestStart(() => {
        unmount();
        getUsers.abort();
      });

      await getUsers.send();
      await openDetails(view, getUsers.queryKey);

      await waitFor(() => {
        expect(getOverviewValue("Canceled Requests:")).toHaveTextContent("1 request");
      });
      expect(getOverviewValue("Processed Requests:")).toHaveTextContent("0 requests");
      const overview = within(screen.getByText("Request Overview").parentElement!);
      expect(overview.getByText("Success Rate").nextSibling).toHaveTextContent("0%");
    });
  });

  describe("When the user application stopped the queue before it was opened", () => {
    it("should offer to start it and start it in the user application", async () => {
      const { client, getUsers, view } = await setup();
      mockRequest(getUsers, { data: [] });
      await getUsers.send();
      client.fetchDispatcher.stop(getUsers.queryKey);
      const card = await getCard(getUsers.queryKey);
      await waitFor(() => {
        expect(card.textContent).toContain("Stopped");
      });
      await openDetails(view, getUsers.queryKey);

      await clickAction(view, "Start");

      await waitFor(() => {
        expect(client.fetchDispatcher.getQueue(getUsers.queryKey).stopped).toBeFalse();
      });
      await waitFor(() => {
        expect(card.textContent).not.toContain("Stopped");
      });
    });
  });

  describe("When the network list was cleared", () => {
    it("should still set the loading state of the queue in the user application", async () => {
      const { client, getUsers, view } = await setup();
      mockRequest(getUsers, { data: [] });
      await getUsers.send();
      await getCard(getUsers.queryKey);
      await clearNetwork(view);
      await openDetails(view, getUsers.queryKey);
      const onQueueLoading = vi.fn();
      client.requestManager.events.onLoadingByQueue(getUsers.queryKey, onQueueLoading);

      await clickAction(view, "Set loading");

      await waitFor(() => {
        expect(onQueueLoading).toHaveBeenCalledWith(expect.objectContaining({ loading: true }), true);
      });

      await clickAction(view, "Restore loading");

      await waitFor(() => {
        expect(onQueueLoading).toHaveBeenLastCalledWith(expect.objectContaining({ loading: false }), true);
      });
    });

    it("should control the submit dispatcher of a mutation queue", async () => {
      const { client, postUser, view } = await setup();
      mockRequest(postUser, { data: { id: 1, name: "Maciej" } });
      await postUser.send({ payload: { name: "Maciej" } });
      await getCard(postUser.queryKey);
      await clearNetwork(view);
      await openDetails(view, postUser.queryKey);

      await clickAction(view, "Stop");

      await waitFor(() => {
        expect(client.submitDispatcher.getQueue(postUser.queryKey).stopped).toBeTrue();
      });
      expect(client.fetchDispatcher.getQueue(postUser.queryKey).stopped).toBeFalse();
    });

    it("should start a stopped custom key queue through the dispatcher of its waiting request", async () => {
      const { client, view } = await setup();
      const createUser = client.createRequest<{ response: User; payload: { name: string } }>()({
        endpoint: "/users",
        method: "POST",
        queryKey: "create-user",
      });
      mockRequest(createUser, { data: { id: 1, name: "Maciej" } });
      client.submitDispatcher.stop("create-user");
      const promise = createUser.send({ payload: { name: "Maciej" } });
      await getCard("create-user");
      await clearNetwork(view);
      await waitFor(() => {
        expect(useNetworkStore.getState().applications.App.requests).toHaveLength(0);
      });
      await openDetails(view, "create-user");

      await clickAction(view, "Start");

      const response = await promise;
      expect(response.success).toBeTrue();
      expect(client.submitDispatcher.getQueue("create-user").stopped).toBeFalse();
    });
  });
});

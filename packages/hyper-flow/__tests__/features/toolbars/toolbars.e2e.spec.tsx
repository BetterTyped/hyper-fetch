import { createClient } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { screen, waitFor, within } from "@testing-library/react";

import { createHyperFlowEnv } from "../../utils/hyper-flow";
import { useNetworkStore } from "@/store/applications/network.store";

const { startServer, stopServer, resetMocks, mockRequest } = createHttpMockingServer();

const getEndpoints = () =>
  screen
    .queryAllByRole("row")
    .slice(1)
    .map((row) => within(row).queryAllByText(/^\//)[0]?.textContent);

describe("Toolbars [ E2E ]", () => {
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

  const setup = async (page: "network" | "cache" | "queues") => {
    const client = createClient({ url: "http://localhost:5000" });
    const { plugin } = env.connectApp({ client });
    const getUsers = client.createRequest<{ response: { id: number }[] }>()({ endpoint: "/users" });
    const getPosts = client.createRequest<{ response: { id: number }[] }>()({ endpoint: "/posts" });
    const createPost = client.createRequest<{
      response: { id: number };
      payload: { title: string };
      error: { message: string };
    }>()({ endpoint: "/posts", method: "POST" });
    mockRequest(getUsers, { data: [{ id: 1 }] });
    mockRequest(getPosts, { data: [{ id: 2 }] });
    mockRequest(createPost, { status: 400, error: { message: "Invalid" } });

    const view = env.renderApp();
    await env.waitForApp(plugin);
    await view.navigate(`/applications/App/${page}`);

    return { client, view, getUsers, getPosts, createPost };
  };

  const sendAll = async ({
    getUsers,
    getPosts,
    createPost,
  }: Pick<Awaited<ReturnType<typeof setup>>, "getUsers" | "getPosts" | "createPost">) => {
    await getUsers.send();
    await getPosts.send();
    await createPost.send({ payload: { title: "" } });
    await waitFor(() => {
      expect(useNetworkStore.getState().applications.App.requests.filter((item) => item.isFinished)).toHaveLength(3);
    });
  };

  describe("given the network page", () => {
    it("should not show the toolbar before any request", async () => {
      await setup("network");

      expect(await screen.findByText("Network is empty")).toBeInTheDocument();
      expect(screen.queryByRole("searchbox", { name: "Search requests" })).not.toBeInTheDocument();
    });

    it("should filter requests by what is typed in the search box", async () => {
      const requests = await setup("network");
      await sendAll(requests);
      const search = await screen.findByRole("searchbox", { name: "Search requests" });

      await requests.view.user.type(search, "users");

      await waitFor(() => expect(getEndpoints()).toStrictEqual(["/users"]));

      await requests.view.user.clear(search);
      await waitFor(() => expect(getEndpoints()).toHaveLength(3));
    });

    it("should search across endpoints and methods", async () => {
      const requests = await setup("network");
      await sendAll(requests);

      // Matches the POST by its method and the GET by its endpoint, case-insensitively
      await requests.view.user.type(await screen.findByRole("searchbox", { name: "Search requests" }), "POST");

      await waitFor(() => expect(getEndpoints()).toStrictEqual(["/posts", "/posts"]));
      const methods = screen
        .getAllByRole("row")
        .slice(1)
        .map((row) => within(row).getByText(/^(GET|POST)$/).textContent);
      expect(methods.toSorted()).toStrictEqual(["GET", "POST"]);
    });

    it("should tell when nothing matches instead of showing an empty network", async () => {
      const requests = await setup("network");
      await sendAll(requests);

      await requests.view.user.type(await screen.findByRole("searchbox", { name: "Search requests" }), "nothing");

      expect(await screen.findByText("No matching requests")).toBeInTheDocument();
      expect(screen.queryByText("Network is empty")).not.toBeInTheDocument();
    });

    it("should filter requests by status", async () => {
      const requests = await setup("network");
      await sendAll(requests);
      const filters = await screen.findByRole("group", { name: "Filter by status" });

      await requests.view.user.click(within(filters).getByRole("button", { name: "Failed" }));
      await waitFor(() => expect(getEndpoints()).toStrictEqual(["/posts"]));
      expect(within(filters).getByRole("button", { name: "Failed" })).toHaveAttribute("aria-pressed", "true");

      await requests.view.user.click(within(filters).getByRole("button", { name: "Success" }));
      await waitFor(() => expect(getEndpoints()).toStrictEqual(["/posts", "/users"]));

      await requests.view.user.click(within(filters).getByRole("button", { name: "All" }));
      await waitFor(() => expect(getEndpoints()).toHaveLength(3));
      expect(within(filters).getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
    });

    it("should combine the status filter with the search", async () => {
      const requests = await setup("network");
      await sendAll(requests);
      const filters = await screen.findByRole("group", { name: "Filter by status" });

      await requests.view.user.click(within(filters).getByRole("button", { name: "Success" }));
      await requests.view.user.type(screen.getByRole("searchbox", { name: "Search requests" }), "posts");

      await waitFor(() => expect(getEndpoints()).toStrictEqual(["/posts"]));
      expect(within(screen.getAllByRole("row")[1]).getByText("GET")).toBeInTheDocument();
    });

    it("should filter paused requests of a stopped queue", async () => {
      const requests = await setup("network");
      await requests.getPosts.send();
      requests.client.fetchDispatcher.stop(requests.getUsers.queryKey);
      void requests.getUsers.send();
      await waitFor(() => expect(useNetworkStore.getState().applications.App.requests).toHaveLength(2));

      const filters = await screen.findByRole("group", { name: "Filter by status" });
      await requests.view.user.click(within(filters).getByRole("button", { name: "Paused" }));

      await waitFor(() => expect(getEndpoints()).toStrictEqual(["/users"]));
      requests.client.fetchDispatcher.start(requests.getUsers.queryKey);
    });

    it("should clear the list but keep the search and keep listing new requests", async () => {
      const requests = await setup("network");
      await sendAll(requests);
      const search = await screen.findByRole("searchbox", { name: "Search requests" });
      await requests.view.user.type(search, "users");
      await waitFor(() => expect(getEndpoints()).toStrictEqual(["/users"]));

      await requests.view.user.click(screen.getByRole("button", { name: /Clear network/ }));

      expect(await screen.findByText("Network is empty")).toBeInTheDocument();
      await requests.getPosts.send();
      await requests.getUsers.send();
      await waitFor(() => expect(getEndpoints()).toStrictEqual(["/users"]));
      expect(screen.getByRole("searchbox", { name: "Search requests" })).toHaveValue("users");
    });

    it("should keep the search after leaving the page and coming back", async () => {
      const requests = await setup("network");
      await sendAll(requests);
      await requests.view.user.type(await screen.findByRole("searchbox", { name: "Search requests" }), "users");

      await requests.view.navigate("/applications/App/cache");
      await requests.view.navigate("/applications/App/network");

      expect(await screen.findByRole("searchbox", { name: "Search requests" })).toHaveValue("users");
      expect(getEndpoints()).toStrictEqual(["/users"]);
    });
  });

  describe("given the cache page", () => {
    it("should filter cache entries by what is typed in the search box", async () => {
      const requests = await setup("cache");
      await sendAll(requests);
      await waitFor(() => expect(screen.getAllByText(/^GET_\//)).toHaveLength(2));

      await requests.view.user.type(screen.getByRole("searchbox", { name: "Search cache" }), "users");

      await waitFor(() =>
        expect(screen.getAllByText(/^GET_\//).map((cell) => cell.textContent)).toStrictEqual([
          requests.getUsers.cacheKey,
        ]),
      );
    });

    it("should tell when no cache entry matches", async () => {
      const requests = await setup("cache");
      await sendAll(requests);
      await waitFor(() => expect(screen.getAllByText(/^GET_\//)).toHaveLength(2));

      await requests.view.user.type(screen.getByRole("searchbox", { name: "Search cache" }), "nothing");

      expect(await screen.findByText("No matching cache entries")).toBeInTheDocument();
    });
  });

  describe("given the queues page", () => {
    it("should filter queues by what is typed in the search box", async () => {
      const requests = await setup("queues");
      await sendAll(requests);
      await waitFor(() => expect(screen.getByText(requests.getUsers.queryKey)).toBeInTheDocument());

      await requests.view.user.type(screen.getByRole("searchbox", { name: "Search queues" }), "users");

      await waitFor(() => {
        expect(screen.getByText(requests.getUsers.queryKey)).toBeInTheDocument();
        expect(screen.queryByText(requests.getPosts.queryKey)).not.toBeInTheDocument();
      });
    });

    it("should tell when no queue matches", async () => {
      const requests = await setup("queues");
      await sendAll(requests);
      await waitFor(() => expect(screen.getByText(requests.getUsers.queryKey)).toBeInTheDocument());

      await requests.view.user.type(screen.getByRole("searchbox", { name: "Search queues" }), "nothing");

      expect(await screen.findByText("No matching queues")).toBeInTheDocument();
    });
  });
});

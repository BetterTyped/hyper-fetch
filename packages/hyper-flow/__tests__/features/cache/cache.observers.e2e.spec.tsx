import { createClient } from "@hyper-fetch/core";
import { useFetch } from "@hyper-fetch/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { renderHook, screen, waitFor } from "@testing-library/react";

import { createHyperFlowEnv } from "../../utils/hyper-flow";

const { startServer, stopServer, resetMocks, mockRequest } = createHttpMockingServer();

type User = { id: number; name: string };

describe("Cache [ Observers ]", () => {
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

  const createApp = () => {
    const client = createClient({ url: "http://localhost:5000" });
    const { plugin } = env.connectApp({ client });
    const getUsers = client.createRequest<{ response: User[] }>()({ endpoint: "/users" });
    mockRequest(getUsers, { data: [{ id: 1, name: "Maciej" }] });
    return { client, plugin, getUsers };
  };

  /** A component of the user's app reading the request */
  const mountComponent = (request: ReturnType<typeof createApp>["getUsers"]) => renderHook(() => useFetch(request));

  const getRow = (cacheKey: string) =>
    waitFor(() => {
      const row = screen
        .queryAllByText(cacheKey)
        .map((element) => element.closest<HTMLElement>("tr[role=button]"))
        .find((element) => !!element);
      if (!row) {
        throw new Error("No cache row");
      }
      return row;
    });

  const getRowObservers = async (cacheKey: string) => (await getRow(cacheKey)).querySelectorAll("td")[2];

  const getDetailsObservers = () => screen.getByText("Observers:").closest("tr")!.querySelectorAll("td")[1];

  describe("When components of the app read a cache key", () => {
    it("should show how many observe it and follow them mounting and unmounting", async () => {
      const { plugin, getUsers } = createApp();
      const view = env.renderApp();
      await env.waitForApp(plugin);
      await view.navigate("/applications/App/cache");

      const first = mountComponent(getUsers);
      await waitFor(() => expect(first.result.current.data).toStrictEqual([{ id: 1, name: "Maciej" }]));
      mountComponent(getUsers);

      await waitFor(async () => expect(await getRowObservers(getUsers.cacheKey)).toHaveTextContent("2"));
      await view.user.click(await getRow(getUsers.cacheKey));
      await waitFor(() => expect(getDetailsObservers()).toHaveTextContent("2"));

      first.unmount();

      await waitFor(() => expect(getDetailsObservers()).toHaveTextContent("1"));
      expect(await getRowObservers(getUsers.cacheKey)).toHaveTextContent("1");
    });
  });

  describe("When HyperFlow connects after the components mounted", () => {
    it("should show the observers the app already has", async () => {
      const { client, plugin, getUsers } = createApp();
      const component = mountComponent(getUsers);
      await waitFor(() => expect(component.result.current.data).toStrictEqual([{ id: 1, name: "Maciej" }]));
      expect(client.cache.get(getUsers.cacheKey)).toBeDefined();

      const view = env.renderApp();
      await env.waitForApp(plugin);
      await view.navigate("/applications/App/cache");

      await waitFor(async () => expect(await getRowObservers(getUsers.cacheKey)).toHaveTextContent("1"));
    });
  });
});

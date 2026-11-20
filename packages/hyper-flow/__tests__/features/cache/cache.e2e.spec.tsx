import { createClient } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { screen, waitFor, within } from "@testing-library/react";

import { createHyperFlowEnv } from "../../utils/hyper-flow";
import { useCacheStore } from "@/store/applications/cache.store";

const { startServer, stopServer, resetMocks, mockRequest } = createHttpMockingServer();

type User = { id: number; name: string };

describe("Cache [ E2E ]", () => {
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
    const getUser = client.createRequest<{ response: User }>()({ endpoint: "/users/:id" });
    const getSettings = client.createRequest<{ response: { theme: string } }>()({
      endpoint: "/settings",
      cache: false,
    });

    const view = env.renderApp();
    await env.waitForApp(plugin);
    await view.navigate("/applications/App/cache");

    return { client, plugin, getUsers, getUser, getSettings, view };
  };

  /** The cache key is also shown in the details header, so only keys inside list rows count. */
  const queryRow = (cacheKey: string) => {
    const rows = screen.queryAllByText(cacheKey).map((key) => key.closest<HTMLTableRowElement>("tr[role=button]"));
    return rows.find((row) => !!row) ?? null;
  };

  const getRow = (cacheKey: string) =>
    waitFor(() => {
      const row = queryRow(cacheKey);
      if (!row) {
        throw new Error(`No list row for ${cacheKey}`);
      }
      return row;
    });

  const openActions = async (view: Awaited<ReturnType<typeof setup>>["view"], action: RegExp) => {
    await view.user.click(await screen.findByRole("button", { name: /Actions/ }));
    await view.user.click(await screen.findByRole("menuitem", { name: action }));
  };

  const getStoreCaches = () => useCacheStore.getState().applications.App?.caches;

  describe("When listing cache entries", () => {
    it("should show the empty state before anything is cached", async () => {
      await setup();
      expect(await screen.findByText("No cache entries")).toBeInTheDocument();
    });

    it("should list a cached request with its cache key, status and last updated time", async () => {
      const { client, getUsers } = await setup();
      mockRequest(getUsers, { data: [{ id: 1, name: "Maciej" }] });

      await getUsers.send();

      const row = await getRow(getUsers.cacheKey);
      const cached = client.cache.get(getUsers.cacheKey);
      expect(cached?.responseTimestamp).toBeNumber();
      expect(within(row).getByText("Fresh")).toBeInTheDocument();
      expect(within(row).getByText(new Date(cached?.responseTimestamp ?? 0).toLocaleTimeString())).toBeInTheDocument();
      expect(screen.queryByText("No cache entries")).not.toBeInTheDocument();
    });

    it("should keep listing an entry after the page settles", async () => {
      const { getUsers, getSettings } = await setup();
      mockRequest(getUsers, { data: [] });
      // Keeps the test running past the list's former 200ms search debounce, which swapped the list back to
      // the stale copy taken on mount
      mockRequest(getSettings, { data: { theme: "dark" }, delay: 400 });

      await getUsers.send();
      await getRow(getUsers.cacheKey);
      await getSettings.send();

      expect(queryRow(getUsers.cacheKey)).not.toBeNull();
      expect(screen.queryByText("No cache entries")).not.toBeInTheDocument();
    });

    it("should not list requests that skip the cache", async () => {
      const { getUsers, getSettings } = await setup();
      mockRequest(getSettings, { data: { theme: "dark" } });
      mockRequest(getUsers, { data: [] });

      await getSettings.send();
      // A cached request afterwards proves the events of the first one were already processed
      await getUsers.send();

      await getRow(getUsers.cacheKey);
      expect(screen.queryByText(getSettings.cacheKey)).not.toBeInTheDocument();
      expect([...getStoreCaches().keys()]).toStrictEqual([getUsers.cacheKey]);
    });

    it("should list every cache key separately", async () => {
      const { getUsers, getUser } = await setup();
      mockRequest(getUsers, { data: [] });
      mockRequest(getUser, { data: { id: 1, name: "Maciej" } });

      await getUsers.send();
      await getUser.send({ params: { id: 1 } });
      await getUser.send({ params: { id: 2 } });

      await getRow(getUsers.cacheKey);
      await getRow(getUser.setParams({ id: 1 }).cacheKey);
      await getRow(getUser.setParams({ id: 2 }).cacheKey);
      expect(screen.getAllByText(/^GET_\/users/)).toHaveLength(3);
    });

    it("should update an entry in place when the same key is fetched again", async () => {
      const { getUsers } = await setup();
      mockRequest(getUsers, { data: [{ id: 1, name: "Maciej" }] });
      await getUsers.send();
      await getRow(getUsers.cacheKey);

      mockRequest(getUsers, { data: [{ id: 2, name: "Kacper" }] });
      await getUsers.send();

      await waitFor(() => {
        expect(getStoreCaches().get(getUsers.cacheKey)?.cacheData.data).toStrictEqual([{ id: 2, name: "Kacper" }]);
      });
      expect(screen.getAllByText(getUsers.cacheKey)).toHaveLength(1);
    });

    it("should filter the list by the search term", async () => {
      const { getUsers, getUser } = await setup();
      mockRequest(getUsers, { data: [] });
      mockRequest(getUser, { data: { id: 1, name: "Maciej" } });
      await getUsers.send();
      await getUser.send({ params: { id: 1 } });
      const userKey = getUser.setParams({ id: 1 }).cacheKey;
      await getRow(userKey);

      useCacheStore.getState().setSearchTerm("App", "users/1");

      await waitFor(() => {
        expect(queryRow(getUsers.cacheKey)).toBeNull();
      });
      expect(queryRow(userKey)).not.toBeNull();
    });
  });

  describe("When inspecting an entry", () => {
    it("should open the details with the cached data and close them", async () => {
      const { getUsers, view } = await setup();
      mockRequest(getUsers, { data: [{ id: 1, name: "Maciej" }] });
      await getUsers.send();

      await view.user.click(await getRow(getUsers.cacheKey));

      expect(await screen.findByText("/ Details", { exact: false })).toBeInTheDocument();
      expect(await screen.findByDisplayValue("Maciej")).toBeInTheDocument();
      expect(screen.getByText("Time left before stale:")).toBeInTheDocument();
      expect(useCacheStore.getState().applications.App.detailsId).toBe(getUsers.cacheKey);

      const toolbar = screen.getByText("/ Details", { exact: false }).parentElement as HTMLElement;
      await view.user.click(within(toolbar).getAllByRole("button")[0]);

      await waitFor(() => {
        expect(screen.queryByText("/ Details", { exact: false })).not.toBeInTheDocument();
      });
      expect(useCacheStore.getState().applications.App.detailsId).toBeNull();
    });

    it("should show the latest data of the opened entry", async () => {
      const { getUsers, view } = await setup();
      mockRequest(getUsers, { data: [{ id: 1, name: "Maciej" }] });
      await getUsers.send();
      await view.user.click(await getRow(getUsers.cacheKey));
      expect(await screen.findByDisplayValue("Maciej")).toBeInTheDocument();

      mockRequest(getUsers, { data: [{ id: 1, name: "Kacper" }] });
      await getUsers.send();

      expect(await screen.findByDisplayValue("Kacper")).toBeInTheDocument();
      expect(screen.queryByDisplayValue("Maciej")).not.toBeInTheDocument();
    });
  });

  describe("When acting on an entry from HyperFlow", () => {
    it("should invalidate the entry in the user application after confirming", async () => {
      const { client, getUsers, view } = await setup();
      const onInvalidate = vi.fn();
      client.cache.events.onInvalidateByKey(getUsers.cacheKey, onInvalidate);
      mockRequest(getUsers, { data: [] });
      await getUsers.send();
      await view.user.click(await getRow(getUsers.cacheKey));

      await openActions(view, /Invalidate Cache/);
      const dialog = await screen.findByRole("alertdialog");
      expect(within(dialog).getByText("Invalidate Cache Entry")).toBeInTheDocument();
      expect(onInvalidate).not.toHaveBeenCalled();
      await view.user.click(within(dialog).getByRole("button", { name: "Continue" }));

      await waitFor(() => {
        expect(onInvalidate).toHaveBeenCalledTimes(1);
      });
      await waitFor(() => {
        expect(getStoreCaches().get(getUsers.cacheKey)?.cacheData.staleTime).toBe(0);
      });
      expect(within(await getRow(getUsers.cacheKey)).getByText("Stale")).toBeInTheDocument();
    });

    it("should make the user application treat invalidated data as stale", async () => {
      const { client, getUsers, view } = await setup();
      const onInvalidate = vi.fn();
      client.cache.events.onInvalidateByKey(getUsers.cacheKey, onInvalidate);
      mockRequest(getUsers, { data: [] });
      await getUsers.send();
      await view.user.click(await getRow(getUsers.cacheKey));

      await openActions(view, /Invalidate Cache/);
      await view.user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Continue" }));

      await waitFor(() => {
        expect(onInvalidate).toHaveBeenCalledTimes(1);
      });
      // The same thing `client.cache.invalidate(cacheKey)` does in the user application
      expect(client.cache.get(getUsers.cacheKey)?.staleTime).toBe(0);
    });

    it("should not invalidate anything when the dialog is canceled", async () => {
      const { client, getUsers, view } = await setup();
      const onInvalidate = vi.fn();
      client.cache.events.onInvalidateByKey(getUsers.cacheKey, onInvalidate);
      mockRequest(getUsers, { data: [] });
      await getUsers.send();
      await view.user.click(await getRow(getUsers.cacheKey));

      await openActions(view, /Invalidate Cache/);
      await view.user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel" }));

      await waitFor(() => {
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      });
      expect(onInvalidate).not.toHaveBeenCalled();
      expect(getStoreCaches().get(getUsers.cacheKey)?.cacheData.staleTime).toBe(getUsers.staleTime);
    });

    it("should remove the entry from the user application and from the list", async () => {
      const { client, getUsers, getUser, view } = await setup();
      mockRequest(getUsers, { data: [] });
      mockRequest(getUser, { data: { id: 1, name: "Maciej" } });
      await getUsers.send();
      await getUser.send({ params: { id: 1 } });
      const userKey = getUser.setParams({ id: 1 }).cacheKey;
      await view.user.click(await getRow(getUsers.cacheKey));

      await openActions(view, /Remove Cache Entry/);
      await view.user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Remove" }));

      await waitFor(() => {
        expect(client.cache.get(getUsers.cacheKey)).toBeUndefined();
      });
      await waitFor(() => {
        expect(queryRow(getUsers.cacheKey)).toBeNull();
      });
      expect(getStoreCaches().has(getUsers.cacheKey)).toBeFalse();
      expect(screen.queryByText("/ Details", { exact: false })).not.toBeInTheDocument();
      // Other entries stay untouched
      expect(client.cache.get(userKey)).toBeDefined();
      expect(queryRow(userKey)).not.toBeNull();
    });

    it("should write the simulated error into the user cache and show it", async () => {
      const { client, getUsers, view } = await setup();
      const onData = vi.fn();
      client.cache.events.onDataByKey(getUsers.cacheKey, onData);
      mockRequest(getUsers, { data: [{ id: 1, name: "Maciej" }] });
      await getUsers.send();
      onData.mockClear();
      await view.user.click(await getRow(getUsers.cacheKey));

      await openActions(view, /Simulate Error/);
      const dialog = await screen.findByRole("dialog");
      await view.user.click(within(dialog).getByText("Default"));
      await view.user.click(within(dialog).getByRole("button", { name: "Continue" }));

      const simulated = { message: "This is error simulated by HyperFetch Devtools" };
      await waitFor(() => {
        expect(client.cache.get(getUsers.cacheKey)).toMatchObject({ data: null, error: simulated, success: false });
      });
      // Hooks of the user application are notified, flagged as triggered from outside of the application
      expect(onData).toHaveBeenCalledWith(expect.objectContaining({ error: simulated, success: false }), true);
      expect(getStoreCaches().get(getUsers.cacheKey)?.cacheData).toMatchObject({ data: null, error: simulated });
      expect(await screen.findByDisplayValue(simulated.message)).toBeInTheDocument();
      expect(screen.queryByDisplayValue("Maciej")).not.toBeInTheDocument();
    });

    it("should not simulate anything until an error is selected", async () => {
      const { client, getUsers, view } = await setup();
      mockRequest(getUsers, { data: [{ id: 1, name: "Maciej" }] });
      await getUsers.send();
      await view.user.click(await getRow(getUsers.cacheKey));

      await openActions(view, /Simulate Error/);
      await view.user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Continue" }));

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
      expect(client.cache.get(getUsers.cacheKey)).toMatchObject({ data: [{ id: 1, name: "Maciej" }], success: true });
      expect(screen.getByDisplayValue("Maciej")).toBeInTheDocument();
    });
  });

  describe("When the user application changes its cache", () => {
    it("should mark the entry stale when the user application invalidates it", async () => {
      const { client, getUsers } = await setup();
      mockRequest(getUsers, { data: [] });
      await getUsers.send();
      expect(within(await getRow(getUsers.cacheKey)).getByText("Fresh")).toBeInTheDocument();

      client.cache.invalidate(getUsers.cacheKey);

      await waitFor(() => {
        expect(getStoreCaches().get(getUsers.cacheKey)?.cacheData.staleTime).toBe(0);
      });
      expect(within(await getRow(getUsers.cacheKey)).getByText("Stale")).toBeInTheDocument();
    });

    it("should remove the entry when the user application deletes it", async () => {
      const { client, getUsers, getUser } = await setup();
      mockRequest(getUsers, { data: [] });
      mockRequest(getUser, { data: { id: 1, name: "Maciej" } });
      await getUsers.send();
      await getUser.send({ params: { id: 1 } });
      const userKey = getUser.setParams({ id: 1 }).cacheKey;
      await getRow(userKey);

      client.cache.delete(getUsers.cacheKey);

      await waitFor(() => {
        expect(getStoreCaches().has(getUsers.cacheKey)).toBeFalse();
      });
      expect(queryRow(getUsers.cacheKey)).toBeNull();
      expect(queryRow(userKey)).not.toBeNull();
    });
  });
});

import { createClient } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { screen, waitFor, within } from "@testing-library/react";

import { createHyperFlowEnv } from "../../utils/hyper-flow";
import { useApplications } from "@/store/applications/apps.store";

const { startServer, stopServer, resetMocks, mockRequest } = createHttpMockingServer();

type User = { id: number; name: string };

describe("Cache [ Details ]", () => {
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

  /** Sends a cached request in the user's app and opens its entry in HyperFlow. */
  const setup = async () => {
    const client = createClient({ url: "http://localhost:5000" });
    const { plugin } = env.connectApp({ client });
    const getUsers = client.createRequest<{ response: User[] }>()({ endpoint: "/users" });
    mockRequest(getUsers, { data: [{ id: 1, name: "Maciej" }] });

    const view = env.renderApp();
    await env.waitForApp(plugin);
    await view.navigate("/applications/App/cache");
    await getUsers.send();
    const key = await waitFor(() => {
      const row = screen
        .getAllByText(getUsers.cacheKey)
        .map((element) => element.closest<HTMLElement>("tr[role=button]"))
        .find((element) => !!element);
      if (!row) {
        throw new Error("No cache row");
      }
      return row;
    });
    await view.user.click(key);
    expect(await screen.findByDisplayValue("Maciej")).toBeInTheDocument();

    return { client, getUsers, view };
  };

  const simulate = async (view: Awaited<ReturnType<typeof setup>>["view"], errorName: string) => {
    await view.user.click(await screen.findByRole("button", { name: /Actions/ }));
    await view.user.click(await screen.findByRole("menuitem", { name: /Simulate Error/ }));
    const dialog = within(await screen.findByRole("dialog"));
    await view.user.click(dialog.getByText(errorName));
    return dialog;
  };

  describe("When simulating an error", () => {
    it("should write the status of the chosen error into the user cache", async () => {
      const { client, getUsers, view } = await setup();
      useApplications.getState().setSimulatedErrors("App", {
        Unauthorized: { name: "Unauthorized", status: 401, body: { message: "Login first" } },
      });

      const dialog = await simulate(view, "Unauthorized");
      await view.user.click(dialog.getByRole("button", { name: "Continue" }));

      await waitFor(() => {
        expect(client.cache.get(getUsers.cacheKey)).toMatchObject({
          data: null,
          error: { message: "Login first" },
          status: 401,
          success: false,
        });
      });
    });

    it("should select only the clicked error when two errors share a body", async () => {
      const { client, getUsers, view } = await setup();
      const body = { message: "Not allowed" };
      useApplications.getState().setSimulatedErrors("App", {
        Unauthorized: { name: "Unauthorized", status: 401, body },
        Forbidden: { name: "Forbidden", status: 403, body },
      });

      const dialog = await simulate(view, "Forbidden");

      const radios = dialog.getAllByRole("radio");
      expect(radios.filter((radio) => radio.getAttribute("aria-checked") === "true").map((radio) => radio.id)).toEqual([
        "Forbidden",
      ]);
      await view.user.click(dialog.getByRole("button", { name: "Continue" }));
      await waitFor(() => {
        expect(client.cache.get(getUsers.cacheKey)).toMatchObject({ error: body, status: 403 });
      });
    });

    it("should list each error with its status and body", async () => {
      const { view } = await setup();
      useApplications.getState().setSimulatedErrors("App", {
        Unauthorized: { name: "Unauthorized", status: 401, body: { message: "Login first" } },
      });

      const dialog = await simulate(view, "Unauthorized");

      const option = dialog.getByText("Unauthorized").closest("label")!;
      expect(option).toHaveTextContent("Status: 401");
      expect(option).toHaveTextContent('{"message":"Login first"}');
    });
  });

  describe("When reading the entry", () => {
    it("should mark an entry hydrated from server rendering", async () => {
      const { client, getUsers } = await setup();
      expect(screen.queryByText("Hydrated")).not.toBeInTheDocument();

      // What `Hydrate` does on the client with a response rendered on the server
      client.cache.set(getUsers, (previous) => ({ ...previous!, hydrated: true }));

      const hydrated = await screen.findByText("Hydrated");
      // Shown next to the freshness of the entry in the details header
      expect(hydrated.parentElement).toHaveTextContent("Fresh");
    });

    it("should collapse and expand the data and keep it collapsed on the details tab", async () => {
      const { view } = await setup();

      await view.user.click(screen.getByRole("button", { name: "Show Less" }));
      expect(screen.getByRole("button", { name: "Show More" })).toBeInTheDocument();

      await view.user.click(screen.getByRole("tab", { name: "Details" }));
      expect(screen.getByRole("tabpanel")).toHaveTextContent("staleTime");
      expect(screen.getByRole("button", { name: "Show More" })).toBeInTheDocument();

      await view.user.click(screen.getByRole("button", { name: "Show More" }));
      expect(screen.getByRole("button", { name: "Show Less" })).toBeInTheDocument();
    });
  });
});

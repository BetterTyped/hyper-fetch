import { createClient } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { screen, waitFor, within } from "@testing-library/react";

import { createHyperFlowEnv, resetStores } from "../../utils/hyper-flow";
import { defaultSimulatedError, useApplications } from "@/store/applications/apps.store";
import { useNetworkStore } from "@/store/applications/network.store";

const { startServer, stopServer, resetMocks, mockRequest } = createHttpMockingServer();

const getPersistedSettings = (appName = "App") =>
  JSON.parse(String(window.electron.store.get("applications"))).state.applications[appName].settings;

describe("Application settings [ E2E ]", () => {
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
    const client = createClient({ url: "http://localhost:5000/api" });
    const { plugin } = env.connectApp({ client, environment: "staging" });
    const getUsers = client.createRequest<{ response: { id: number }[]; queryParams: { page: number } }>()({
      endpoint: "/users",
    });

    const view = env.renderApp();
    await env.waitForApp(plugin);
    await view.navigate("/applications/App/settings");
    await screen.findByText("Application Settings");

    return { client, plugin, view, getUsers };
  };

  /** The row of one simulated error, found by its name tag. */
  const getErrorRow = (name: string) =>
    within(screen.getByText(name, { selector: "span.font-mono" }).closest<HTMLElement>(".group")!);

  const fillErrorDialog = async (
    view: Awaited<ReturnType<typeof setup>>["view"],
    { name, status, body }: { name?: string; status?: string; body?: string },
  ) => {
    const dialog = within(await screen.findByRole("dialog"));
    if (name !== undefined) {
      await view.user.clear(dialog.getByLabelText("Error Name"));
      await view.user.type(dialog.getByLabelText("Error Name"), name);
    }
    if (status !== undefined) {
      await view.user.clear(dialog.getByLabelText("Status Code"));
      await view.user.type(dialog.getByLabelText("Status Code"), status);
    }
    if (body !== undefined) {
      await view.user.clear(dialog.getByLabelText("Error Body (JSON)"));
      await view.user.click(dialog.getByLabelText("Error Body (JSON)"));
      await view.user.paste(body);
    }
    return dialog;
  };

  describe("Client configuration", () => {
    it("should show the url, environment and adapter reported by the plugin", async () => {
      await setup();

      const card = within(screen.getByText("Client Configuration").closest<HTMLElement>('[data-slot="card"]')!);
      expect(card.getByText("http://localhost:5000/api")).toBeInTheDocument();
      expect(card.getByText("staging")).toBeInTheDocument();
      expect(card.getByText("http")).toBeInTheDocument();
    });
  });

  describe("Simulated errors", () => {
    it("should list the default error as a system error that cannot be edited or removed", async () => {
      await setup();

      const row = getErrorRow("Default");
      expect(row.getByText("System")).toBeInTheDocument();
      expect(row.getByText("400")).toBeInTheDocument();
      expect(row.getByText(JSON.stringify(defaultSimulatedError.body))).toBeInTheDocument();
      expect(row.queryByRole("button", { name: /Remove/ })).not.toBeInTheDocument();
      expect(row.queryByRole("button", { name: /Edit/ })).not.toBeInTheDocument();
    });

    it("should add a simulated error through the dialog", async () => {
      const { view } = await setup();

      await view.user.click(screen.getByRole("button", { name: /Add Error Response/ }));
      const dialog = await fillErrorDialog(view, {
        name: "Unauthorized",
        status: "401",
        body: '{"message":"Login first"}',
      });
      await view.user.click(dialog.getByRole("button", { name: "Add Error" }));

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
      const row = getErrorRow("Unauthorized");
      expect(row.getByText("401")).toBeInTheDocument();
      expect(row.getByText('{"message":"Login first"}')).toBeInTheDocument();
      expect(useApplications.getState().applications.App.settings.simulatedErrors).toStrictEqual({
        Default: defaultSimulatedError,
        Unauthorized: {
          name: "Unauthorized",
          status: 401,
          body: { message: "Login first" },
        },
      });
    });

    it("should not add an error without a name", async () => {
      const { view } = await setup();

      await view.user.click(screen.getByRole("button", { name: /Add Error Response/ }));
      const dialog = await fillErrorDialog(view, { status: "418", body: "{}" });
      await view.user.click(dialog.getByRole("button", { name: "Add Error" }));

      expect(await dialog.findByText("Error name is required")).toBeInTheDocument();
      expect(Object.keys(useApplications.getState().applications.App.settings.simulatedErrors)).toStrictEqual([
        "Default",
      ]);
    });

    it("should edit a simulated error and replace it under its new name", async () => {
      const { view } = await setup();
      useApplications.getState().setSimulatedErrors("App", {
        Unauthorized: {
          name: "Unauthorized",
          status: 401,
          body: { message: "Login first" },
        },
      });

      await view.user.click(await waitFor(() => getErrorRow("Unauthorized").getByRole("button", { name: /Edit/ })));
      const dialog = within(await screen.findByRole("dialog"));
      expect(dialog.getByText("Edit Error Response")).toBeInTheDocument();
      expect(dialog.getByLabelText("Error Name")).toHaveValue("Unauthorized");
      expect(dialog.getByLabelText("Status Code")).toHaveValue(401);

      await fillErrorDialog(view, {
        name: "Forbidden",
        status: "403",
        body: '{"message":"No access"}',
      });
      await view.user.click(dialog.getByRole("button", { name: "Save Changes" }));

      await waitFor(() => {
        expect(screen.queryByText("Unauthorized", { selector: "span.font-mono" })).not.toBeInTheDocument();
      });
      const row = getErrorRow("Forbidden");
      expect(row.getByText("403")).toBeInTheDocument();
      expect(row.getByText('{"message":"No access"}')).toBeInTheDocument();
      expect(useApplications.getState().applications.App.settings.simulatedErrors).toStrictEqual({
        Default: defaultSimulatedError,
        Forbidden: {
          name: "Forbidden",
          status: 403,
          body: { message: "No access" },
        },
      });
    });

    it("should show the current values when an error is edited a second time", async () => {
      const { view } = await setup();
      useApplications.getState().setSimulatedErrors("App", {
        Unauthorized: {
          name: "Unauthorized",
          status: 401,
          body: { message: "Login first" },
        },
      });

      await view.user.click(await waitFor(() => getErrorRow("Unauthorized").getByRole("button", { name: /Edit/ })));
      const dialog = await fillErrorDialog(view, { status: "419" });
      await view.user.click(dialog.getByRole("button", { name: "Save Changes" }));
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });

      await view.user.click(getErrorRow("Unauthorized").getByRole("button", { name: /Edit/ }));
      const reopened = within(await screen.findByRole("dialog"));
      expect(reopened.getByLabelText("Error Name")).toHaveValue("Unauthorized");
      expect(reopened.getByLabelText("Status Code")).toHaveValue(419);
    });

    it("should remove a simulated error but keep the default one", async () => {
      const { view } = await setup();
      useApplications.getState().setSimulatedErrors("App", {
        Unauthorized: {
          name: "Unauthorized",
          status: 401,
          body: { message: "Login first" },
        },
      });

      await view.user.click(await waitFor(() => getErrorRow("Unauthorized").getByRole("button", { name: /Remove/ })));

      await waitFor(() => {
        expect(screen.queryByText("Unauthorized", { selector: "span.font-mono" })).not.toBeInTheDocument();
      });
      expect(getErrorRow("Default").getByText("System")).toBeInTheDocument();
      expect(useApplications.getState().applications.App.settings.simulatedErrors).toStrictEqual({
        Default: defaultSimulatedError,
      });
    });

    it("should persist simulated errors across a restart", async () => {
      const { view } = await setup();

      await view.user.click(screen.getByRole("button", { name: /Add Error Response/ }));
      const dialog = await fillErrorDialog(view, {
        name: "Teapot",
        status: "418",
        body: '{"tea":true}',
      });
      await view.user.click(dialog.getByRole("button", { name: "Add Error" }));
      await waitFor(() => {
        expect(getPersistedSettings().simulatedErrors.Teapot).toStrictEqual({
          name: "Teapot",
          status: 418,
          body: { tea: true },
        });
      });

      // The app reconnects after a restart: the stored errors must win over the plugin's defaults.
      view.unmount();
      await env.stop();
      const persisted = window.electron.store.get("applications");
      await env.start();
      window.electron.store.set("applications", persisted);
      await useApplications.persist.rehydrate();
      const { plugin } = env.connectApp({ environment: "staging" });
      const remounted = env.renderApp();
      await env.waitForApp(plugin);
      await remounted.navigate("/applications/App/settings");

      expect(await screen.findByText("Teapot", { selector: "span.font-mono" })).toBeInTheDocument();
      expect(useApplications.getState().applications.App.settings.simulatedErrors.Teapot.status).toBe(418);
    });
  });

  describe("Network history limit", () => {
    const setLimit = async (view: Awaited<ReturnType<typeof setup>>["view"], limit: string) => {
      const input = screen.getByRole("spinbutton");
      await view.user.clear(input);
      await view.user.type(input, limit);
    };

    it("should default to 1000 entries", async () => {
      await setup();

      expect(screen.getByRole("spinbutton")).toHaveValue(1000);
      expect(useApplications.getState().applications.App.settings.maxRequestsHistorySize).toBe(1000);
    });

    it("should keep only the newest requests up to the limit", async () => {
      const { view, getUsers } = await setup();
      mockRequest(getUsers, { data: [] });
      await setLimit(view, "3");
      expect(useApplications.getState().applications.App.settings.maxRequestsHistorySize).toBe(3);

      for (let page = 1; page <= 5; page++) {
        // eslint-disable-next-line no-await-in-loop
        await getUsers.send({ queryParams: { page } });
      }

      await waitFor(() => {
        const { requests } = useNetworkStore.getState().applications.App;
        expect(requests.map((item) => item.request.queryParams)).toStrictEqual([{ page: 5 }, { page: 4 }, { page: 3 }]);
        expect(requests.every((item) => item.isFinished)).toBeTrue();
      });
      await view.navigate("/applications/App/network");
      await waitFor(() => {
        expect(screen.getAllByText("/users")).toHaveLength(3);
      });
    });

    it("should trim the history when the limit is lowered below the current size", async () => {
      const { view, getUsers } = await setup();
      mockRequest(getUsers, { data: [] });
      for (let page = 1; page <= 5; page++) {
        // eslint-disable-next-line no-await-in-loop
        await getUsers.send({ queryParams: { page } });
      }
      await waitFor(() => {
        expect(useNetworkStore.getState().applications.App.requests).toHaveLength(5);
      });

      await setLimit(view, "2");
      await getUsers.send({ queryParams: { page: 6 } });

      await waitFor(() => {
        expect(
          useNetworkStore.getState().applications.App.requests.map((item) => item.request.queryParams),
        ).toStrictEqual([{ page: 6 }, { page: 5 }]);
      });
    });

    it("should never store an invalid limit while the field is being edited", async () => {
      const { view } = await setup();

      await view.user.clear(screen.getByRole("spinbutton"));

      const limit = useApplications.getState().applications.App.settings.maxRequestsHistorySize;
      expect(Number.isInteger(limit) && limit >= 1).toBeTrue();
      expect(getPersistedSettings().maxRequestsHistorySize).toBe(limit);

      // Leaving the empty field shows the limit that is actually in use.
      await view.user.tab();
      expect(screen.getByRole("spinbutton")).toHaveValue(limit);
    });

    it("should persist the limit", async () => {
      const { view } = await setup();

      await setLimit(view, "25");

      await waitFor(() => {
        expect(getPersistedSettings().maxRequestsHistorySize).toBe(25);
      });
      // Rehydrating from electron-store gives the same value back.
      const persisted = window.electron.store.get("applications");
      resetStores();
      window.electron.store.set("applications", persisted);
      await useApplications.persist.rehydrate();
      expect(useApplications.getState().applications.App.settings.maxRequestsHistorySize).toBe(25);
    });
  });
});

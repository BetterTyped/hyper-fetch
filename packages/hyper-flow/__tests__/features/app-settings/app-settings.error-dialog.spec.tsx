import { createClient } from "@hyper-fetch/core";
import { act, screen, waitFor, within } from "@testing-library/react";

import { createHyperFlowEnv } from "../../utils/hyper-flow";
import type { SimulatedError } from "@/store/applications/apps.store";
import { defaultSimulatedError, useApplications } from "@/store/applications/apps.store";

describe("Application settings [ Error dialog ]", () => {
  const env = createHyperFlowEnv();

  beforeEach(async () => {
    await env.start();
  });

  afterEach(async () => {
    await env.stop();
  });

  const setup = async ({ url = "http://localhost:5000/api" }: { url?: string } = {}) => {
    const client = createClient({ url });
    const { plugin } = env.connectApp({ client });

    const view = env.renderApp();
    await env.waitForApp(plugin);
    await view.navigate("/applications/App/settings");
    await screen.findByText("Application Settings");

    return { client, view };
  };

  const getErrors = () => useApplications.getState().applications.App.settings.simulatedErrors;

  const addStoredError = (error: SimulatedError) => {
    useApplications.getState().setSimulatedErrors("App", { [error.name]: error });
  };

  const getErrorRow = (name: string) =>
    within(screen.getByText(name, { selector: "span.font-mono" }).closest<HTMLElement>(".group")!);

  const openAddDialog = async (view: Awaited<ReturnType<typeof setup>>["view"]) => {
    await view.user.click(screen.getByRole("button", { name: /Add Error Response/ }));
    return within(await screen.findByRole("dialog"));
  };

  const openEditDialog = async (view: Awaited<ReturnType<typeof setup>>["view"], name: string) => {
    await view.user.click(await waitFor(() => getErrorRow(name).getByRole("button", { name: /Edit/ })));
    return within(await screen.findByRole("dialog"));
  };

  const closeDialog = async (view: Awaited<ReturnType<typeof setup>>["view"], dialog: ReturnType<typeof within>) => {
    await view.user.click(dialog.getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  };

  const setName = async (
    view: Awaited<ReturnType<typeof setup>>["view"],
    dialog: ReturnType<typeof within>,
    name: string,
  ) => {
    await view.user.clear(dialog.getByLabelText("Error Name"));
    await view.user.type(dialog.getByLabelText("Error Name"), name);
  };

  describe("Client configuration", () => {
    it("should say the base url is not configured when the client has none", async () => {
      await setup({ url: "" });

      const card = within(screen.getByText("Client Configuration").closest<HTMLElement>('[data-slot="card"]')!);
      expect(card.getByText("Not configured")).toBeInTheDocument();
    });
  });

  describe("Statuses", () => {
    it("should store the default status as a number", async () => {
      const { view } = await setup();

      const dialog = await openAddDialog(view);
      await setName(view, dialog, "Generic");
      await view.user.click(dialog.getByRole("button", { name: "Add Error" }));

      await waitFor(() => {
        expect(getErrors().Generic).toStrictEqual({ name: "Generic", status: 400, body: {} });
      });
      const edit = await openEditDialog(view, "Generic");
      expect(edit.getByRole("checkbox", { name: "Numeric Status" })).toBeChecked();
    });

    it("should add an error with a text status", async () => {
      const { view } = await setup();

      const dialog = await openAddDialog(view);
      await setName(view, dialog, "Offline");
      await view.user.click(dialog.getByRole("checkbox", { name: "Numeric Status" }));
      const status = dialog.getByLabelText("Status Code");
      expect(status).toHaveAttribute("type", "text");
      expect(status).toHaveValue("400");
      await view.user.clear(status);
      await view.user.type(status, "offline");
      await view.user.click(dialog.getByRole("button", { name: "Add Error" }));

      await waitFor(() => {
        expect(getErrors().Offline).toStrictEqual({ name: "Offline", status: "offline", body: {} });
      });
      expect(getErrorRow("Offline").getByText("offline")).toBeInTheDocument();
    });

    it("should turn a numeric text status back into a number", async () => {
      const { view } = await setup();

      const dialog = await openAddDialog(view);
      await setName(view, dialog, "Unavailable");
      const toggle = dialog.getByRole("checkbox", { name: "Numeric Status" });
      await view.user.click(toggle);
      await view.user.clear(dialog.getByLabelText("Status Code"));
      await view.user.type(dialog.getByLabelText("Status Code"), "503");
      await view.user.click(toggle);

      expect(dialog.getByLabelText("Status Code")).toHaveAttribute("type", "number");
      expect(dialog.getByLabelText("Status Code")).toHaveValue(503);
      await view.user.click(dialog.getByRole("button", { name: "Add Error" }));
      await waitFor(() => {
        expect(getErrors().Unavailable.status).toBe(503);
      });
    });

    it("should fall back to 400 when a word status is switched to a number", async () => {
      const { view } = await setup();

      const dialog = await openAddDialog(view);
      const toggle = dialog.getByRole("checkbox", { name: "Numeric Status" });
      await view.user.click(toggle);
      await view.user.clear(dialog.getByLabelText("Status Code"));
      await view.user.type(dialog.getByLabelText("Status Code"), "offline");
      await view.user.click(toggle);

      expect(dialog.getByLabelText("Status Code")).toHaveValue(400);
    });

    it("should not show NaN when an emptied number status is switched to text", async () => {
      const { view } = await setup();

      const dialog = await openAddDialog(view);
      await view.user.clear(dialog.getByLabelText("Status Code"));
      await view.user.click(dialog.getByRole("checkbox", { name: "Numeric Status" }));

      expect(dialog.getByLabelText("Status Code")).toHaveValue("");
    });

    it("should not add an error without a status", async () => {
      const { view } = await setup();

      const dialog = await openAddDialog(view);
      await setName(view, dialog, "Empty");
      await view.user.clear(dialog.getByLabelText("Status Code"));
      await view.user.click(dialog.getByRole("button", { name: "Add Error" }));

      expect(await dialog.findByText("Status is required")).toBeInTheDocument();
      expect(getErrors().Empty).toBeUndefined();
    });

    it("should open an error with a text status in text mode", async () => {
      const { view } = await setup();
      addStoredError({ name: "Offline", status: "offline", body: { reason: "network" } });

      const dialog = await openEditDialog(view, "Offline");

      expect(dialog.getByRole("checkbox", { name: "Numeric Status" })).not.toBeChecked();
      expect(dialog.getByLabelText("Status Code")).toHaveValue("offline");
      expect(dialog.getByLabelText("Error Body (JSON)")).toHaveValue(JSON.stringify({ reason: "network" }, null, 2));
    });
  });

  describe("Bodies", () => {
    it("should keep a body that is not JSON as text", async () => {
      const { view } = await setup();

      const dialog = await openAddDialog(view);
      await setName(view, dialog, "Plain");
      await view.user.clear(dialog.getByLabelText("Error Body (JSON)"));
      await view.user.type(dialog.getByLabelText("Error Body (JSON)"), "Service down");
      await view.user.click(dialog.getByRole("button", { name: "Add Error" }));

      await waitFor(() => {
        expect(getErrors().Plain.body).toBe("Service down");
      });
      expect(getErrorRow("Plain").getByText("Service down")).toBeInTheDocument();

      const edit = await openEditDialog(view, "Plain");
      expect(edit.getByLabelText("Error Body (JSON)")).toHaveValue("Service down");
    });

    it("should indent the body with spaces at the cursor when Tab is pressed", async () => {
      const { view } = await setup();

      const dialog = await openAddDialog(view);
      const body = dialog.getByLabelText("Error Body (JSON)");
      await view.user.click(body);
      // Between the braces of the default "{}"
      await view.user.keyboard("{ArrowLeft}{Tab}");
      expect(body).toHaveFocus();
      expect(body).toHaveValue("{    }");

      // The cursor is restored after the inserted spaces once the new value is rendered
      await act(
        () =>
          new Promise<void>((resolve) => {
            requestAnimationFrame(() => resolve());
          }),
      );
      await view.user.keyboard('"a": 1');

      expect(body).toHaveValue('{    "a": 1}');
    });
  });

  describe("Canceling", () => {
    it("should discard the draft when the dialog is closed with Escape", async () => {
      const { view } = await setup();

      const dialog = await openAddDialog(view);
      await setName(view, dialog, "Draft");
      await view.user.keyboard("{Escape}");
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });

      expect(getErrors().Draft).toBeUndefined();
      const reopened = await openAddDialog(view);
      expect(reopened.getByLabelText("Error Name")).toHaveValue("");
    });

    it("should not change the error when the edit is canceled", async () => {
      const { view } = await setup();
      addStoredError({ name: "Unauthorized", status: 401, body: { message: "Login first" } });

      const dialog = await openEditDialog(view, "Unauthorized");
      await setName(view, dialog, "Changed");
      await closeDialog(view, dialog);

      expect(getErrors()).toStrictEqual({
        Default: defaultSimulatedError,
        Unauthorized: { name: "Unauthorized", status: 401, body: { message: "Login first" } },
      });
      const reopened = await openEditDialog(view, "Unauthorized");
      expect(reopened.getByLabelText("Error Name")).toHaveValue("Unauthorized");
    });

    it("should start a new error from empty fields after a canceled one", async () => {
      const { view } = await setup();

      const dialog = await openAddDialog(view);
      await setName(view, dialog, "Draft");
      await view.user.click(dialog.getByRole("checkbox", { name: "Numeric Status" }));
      await closeDialog(view, dialog);

      expect(getErrors().Draft).toBeUndefined();
      const reopened = await openAddDialog(view);
      expect(reopened.getByLabelText("Error Name")).toHaveValue("");
      expect(reopened.getByRole("checkbox", { name: "Numeric Status" })).toBeChecked();
      expect(reopened.getByLabelText("Status Code")).toHaveValue(400);
    });
  });
});

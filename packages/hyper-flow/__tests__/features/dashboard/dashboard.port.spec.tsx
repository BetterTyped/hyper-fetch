import { screen, waitFor, within } from "@testing-library/react";

import { createHyperFlowEnv } from "../../utils/hyper-flow";
import { useSettings } from "@/store/general/settings.store";

const restart = vi.mocked(window.electron.server.restart);
const status = vi.mocked(window.electron.server.status);

type RestartResult = Awaited<ReturnType<typeof window.electron.server.restart>>;

describe("Dashboard [ Port configuration ]", () => {
  const env = createHyperFlowEnv();

  beforeEach(async () => {
    await env.start();
  });

  afterEach(async () => {
    await env.stop();
    restart.mockReset();
    status.mockReset();
  });

  const openDialog = async (view: ReturnType<typeof env.renderApp>) => {
    await view.user.click(await screen.findByRole("button", { name: /Change Port/ }));
    return within(await screen.findByRole("dialog"));
  };

  const typePort = async (view: ReturnType<typeof env.renderApp>, dialog: ReturnType<typeof within>, port: string) => {
    const input = dialog.getByLabelText("Port Number");
    await view.user.clear(input);
    await view.user.type(input, port);
  };

  it("should open with the current port after a change was canceled", async () => {
    const port = env.getPort();
    const view = env.renderApp({ url: "/settings" });
    await screen.findByText(String(port));

    const dialog = await openDialog(view);
    await typePort(view, dialog, "3000");
    await view.user.click(dialog.getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    const reopened = await openDialog(view);
    expect(reopened.getByLabelText("Port Number")).toHaveValue(port);
    expect(restart).not.toHaveBeenCalled();
  });

  it("should restart the server once when the change is submitted again while it restarts", async () => {
    const port = env.getPort();
    let finishRestart: (result: RestartResult) => void = () => {};
    restart.mockImplementation(
      () =>
        new Promise<RestartResult>((resolve) => {
          finishRestart = resolve;
        }),
    );
    const view = env.renderApp({ url: "/settings" });
    await screen.findByText(String(port));

    const dialog = await openDialog(view);
    await typePort(view, dialog, "3000");
    await view.user.click(dialog.getByRole("button", { name: "Save Changes" }));
    await view.user.click(dialog.getByRole("button", { name: "Save Changes" }));

    expect(restart).toHaveBeenCalledTimes(1);
    finishRestart({ running: false, port, success: false, message: "Port 3000 is already in use" });
    expect(await screen.findByText("Port 3000 is already in use")).toBeInTheDocument();
    expect(useSettings.getState().settings.serverPort).toBe(port);
  });

  it("should tell when restarting a crashed server on the current port fails", async () => {
    const port = env.getPort();
    status.mockReturnValue(false);
    restart.mockResolvedValue({ running: false, port, success: false, message: "Address in use" });
    const view = env.renderApp({ url: "/settings" });

    const title = await screen.findByText("Server Crashed");
    const alert = within(title.closest<HTMLElement>('[role="alert"]')!);
    await view.user.click(alert.getByRole("button", { name: "Restart Server" }));

    expect(await screen.findByText("Address in use")).toBeInTheDocument();
    expect(restart).toHaveBeenCalledWith({ port });
    expect(alert.getByRole("button", { name: "Restart Server" })).toBeEnabled();
  });
});

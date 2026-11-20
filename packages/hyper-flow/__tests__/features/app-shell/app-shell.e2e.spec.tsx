import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { createHyperFlowEnv } from "../../utils/hyper-flow";
import { AppError } from "@/components/errors/app-error";
import { useSettings } from "@/store/general/settings.store";

const status = vi.mocked(window.electron.server.status);
const restart = vi.mocked(window.electron.server.restart);
const onStatusChange = vi.mocked(window.electron.server.onStatusChange);
// Set with mockImplementation in the setup, so a reset would drop it instead of restoring it
const reportsRunning = onStatusChange.getMockImplementation()!;

describe("App shell [ E2E ]", () => {
  const env = createHyperFlowEnv();

  beforeEach(async () => {
    await env.start();
  });

  afterEach(async () => {
    await env.stop();
    status.mockReset();
    restart.mockReset();
    onStatusChange.mockImplementation(reportsRunning);
  });

  describe("Window controls", () => {
    const send = vi.fn();

    beforeEach(() => {
      // The preload bridge exposes Electron's ipcRenderer; the main process listens on these channels
      Object.defineProperty(window.electron, "ipcRenderer", { value: { send }, configurable: true });
    });

    afterEach(() => {
      Reflect.deleteProperty(window.electron, "ipcRenderer");
      send.mockReset();
    });

    it("should ask the main process to close, minimize and maximize the window", async () => {
      const view = env.renderApp();

      await view.user.click(await screen.findByRole("button", { name: "Close" }));
      await view.user.click(screen.getByRole("button", { name: "Minimize" }));
      await view.user.click(screen.getByRole("button", { name: "Maximize" }));

      expect(send.mock.calls).toStrictEqual([["window-close"], ["window-minimize"], ["window-maximize"]]);
    });

    it("should grey out the controls while the window is not focused", async () => {
      env.renderApp();
      const close = await screen.findByRole("button", { name: "Close" });
      expect(close).toHaveClass("bg-red-500");

      act(() => {
        fireEvent.blur(window);
      });
      expect(close).toHaveClass("bg-zinc-700");
      expect(screen.getByRole("button", { name: "Maximize" })).toHaveClass("bg-zinc-700");

      act(() => {
        fireEvent.focus(window);
      });
      expect(close).toHaveClass("bg-red-500");
    });

    it("should go back to the dashboard from the home breadcrumb", async () => {
      const view = env.renderApp({ url: "/settings" });
      await screen.findByRole("button", { name: /Change Port/ });

      await view.user.click(screen.getByText("Home"));

      await waitFor(() => {
        expect(view.router.state.location.pathname).toBe("/");
      });
    });
  });

  describe("Server status", () => {
    /** Lets the spec play the main process reporting server status changes. */
    const captureStatusListener = () => {
      const listeners: ((running: boolean) => void)[] = [];
      onStatusChange.mockImplementation((callback) => {
        listeners.push(callback);
        return () => {
          listeners.splice(listeners.indexOf(callback), 1);
        };
      });
      return (running: boolean) => {
        act(() => {
          listeners.forEach((listener) => listener(running));
        });
      };
    };

    it("should show the crash and clear it when the server comes back on its own", async () => {
      const emitStatus = captureStatusListener();
      env.renderApp();
      await screen.findByRole("button", { name: "Close" });

      emitStatus(false);

      expect(await screen.findByText("Application Server Crashed")).toBeInTheDocument();
      expect(await screen.findByText("Server is not running")).toBeInTheDocument();
      expect(useSettings.getState().serverStatus).toBe("crashed");

      emitStatus(true);

      await waitFor(() => {
        expect(screen.queryByText("Application Server Crashed")).not.toBeInTheDocument();
      });
      expect(useSettings.getState().serverStatus).toBe("running");
      await waitFor(() => {
        expect(screen.queryByText("Server is not running")).not.toBeInTheDocument();
      });
    });

    it("should notify every outage, not only the first one", async () => {
      const emitStatus = captureStatusListener();
      env.renderApp();
      await screen.findByRole("button", { name: "Close" });
      emitStatus(false);
      expect(await screen.findByText("Server is not running")).toBeInTheDocument();
      emitStatus(true);
      await waitFor(() => {
        expect(screen.queryByText("Server is not running")).not.toBeInTheDocument();
      });

      emitStatus(false);

      expect(await screen.findByText("Server is not running")).toBeInTheDocument();
      expect(screen.getByText("Application Server Crashed")).toBeInTheDocument();
    });

    it("should show one notification when the crash is reported again", async () => {
      const emitStatus = captureStatusListener();
      env.renderApp();
      await screen.findByRole("button", { name: "Close" });

      emitStatus(false);
      emitStatus(false);

      expect(await screen.findAllByText("Server is not running")).toHaveLength(1);
    });

    it("should restart a crashed server from the notification", async () => {
      const emitStatus = captureStatusListener();
      restart.mockResolvedValue({ running: true, port: 4321, success: true, message: "" });
      const view = env.renderApp();
      await screen.findByRole("button", { name: "Close" });
      emitStatus(false);

      await view.user.click(await screen.findByRole("button", { name: "Restart Server" }));

      expect(await screen.findByText("Server is now running on port 4321")).toBeInTheDocument();
      expect(restart).toHaveBeenCalledTimes(1);
      await waitFor(() => {
        expect(screen.queryByText("Application Server Crashed")).not.toBeInTheDocument();
      });
    });

    it("should offer the settings when the restart from the notification fails", async () => {
      captureStatusListener();
      status.mockReturnValue(false);
      restart.mockResolvedValue({ running: false, port: 2137, success: false, message: "Port 2137 is in use" });
      const view = env.renderApp();

      expect(await screen.findByText("Application Server Crashed")).toBeInTheDocument();
      await view.user.click(await screen.findByRole("button", { name: "Restart Server" }));
      expect(await screen.findByText("Failed to start server")).toBeInTheDocument();
      expect(screen.getByText("Port 2137 is in use")).toBeInTheDocument();
      expect(screen.getByText("Application Server Crashed")).toBeInTheDocument();

      await view.user.click(screen.getByRole("button", { name: "Open settings" }));

      await waitFor(() => {
        expect(view.router.state.location.pathname).toBe("/settings");
      });
    });

    it("should treat a server status that cannot be read as a crash", async () => {
      captureStatusListener();
      status.mockImplementation(() => {
        throw new Error("IPC closed");
      });
      env.renderApp();

      expect(await screen.findByText("Application Server Crashed")).toBeInTheDocument();
    });
  });

  describe("Crash screen", () => {
    /** HyperFlow's crash screen as the router's error boundary, around a page that throws until it is fixed. */
    const renderCrashingPage = (error: Error) => {
      const page = { broken: true };
      // React and the crash screen both log the error
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      const rootRoute = createRootRoute({ errorComponent: AppError });
      const pageRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/",
        component: () => {
          if (page.broken) {
            throw error;
          }
          return <p>Page works</p>;
        },
      });
      const router = createRouter({
        routeTree: rootRoute.addChildren([pageRoute]),
        history: createMemoryHistory({ initialEntries: ["/"] }),
      });
      render(<RouterProvider router={router} />);
      return { page, consoleError };
    };

    it("should show the error and render the page again after a refresh", async () => {
      const user = userEvent.setup();
      const error = new Error("Cannot read the cache");
      const { page, consoleError } = renderCrashingPage(error);

      expect(await screen.findByText("App crashed")).toBeInTheDocument();
      expect(screen.getByText("Cannot read the cache")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Go to Dashboard/ })).toHaveAttribute("href", "/");

      page.broken = false;
      await user.click(screen.getByRole("button", { name: /Refresh Page/ }));

      expect(await screen.findByText("Page works")).toBeInTheDocument();
      consoleError.mockRestore();
    });

    it("should explain the crash when the error has no message", async () => {
      const { consoleError } = renderCrashingPage(new Error(""));

      expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
      consoleError.mockRestore();
    });
  });
});

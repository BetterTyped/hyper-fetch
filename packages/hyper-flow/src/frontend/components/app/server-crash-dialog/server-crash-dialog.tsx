import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/store/general/settings.store";

export const ServerCrashDialog = () => {
  const navigate = useNavigate();
  const serverStatus = useSettings((state) => state.serverStatus);

  useEffect(() => {
    const { setServerStatus } = useSettings.getState();
    // Each outage gets its own notification, reusing one id would let a closing notification swallow the next outage
    let serverDownToast: string | number | undefined;
    let unmounted = false;

    const restartServer = async () => {
      const result = await window.electron.server.restart();
      if (result.success) {
        setServerStatus("running");
        toast("Server started", {
          description: `Server is now running on port ${result.port}`,
        });
      } else {
        toast("Failed to start server", {
          description: result.message,
          action: {
            label: "Open settings",
            onClick: () => {
              navigate({ to: "/settings" });
            },
          },
        });
      }
    };

    // The status is read from the store, the listener below outlives the render it was created in
    const reportCrash = () => {
      if (useSettings.getState().serverStatus === "crashed") {
        return;
      }
      setServerStatus("crashed");
      serverDownToast = toast("Server is not running", {
        description: "Please start the server to continue",
        duration: Infinity,
        action: {
          label: "Restart Server",
          onClick: restartServer,
        },
      });
    };

    const reportRunning = () => {
      setServerStatus("running");
      // Without an id sonner would dismiss every notification
      if (serverDownToast !== undefined) {
        toast.dismiss(serverDownToast);
      }
    };

    const checkInitialStatus = async () => {
      let running = false;
      try {
        running = await window.electron.server.status();
      } catch {
        // A status that cannot be read means the server cannot be reached either
      }
      // Effects of an unmounted dialog, like the first run in StrictMode, must not notify
      if (unmounted) {
        return;
      }
      if (running) {
        reportRunning();
      } else {
        reportCrash();
      }
    };

    checkInitialStatus();

    const unsubscribe = window.electron.server.onStatusChange((isRunning: boolean) => {
      if (isRunning) {
        reportRunning();
      } else {
        reportCrash();
      }
    });

    return () => {
      unmounted = true;
      unsubscribe();
    };
  }, [navigate]);

  if (serverStatus === "crashed") {
    return (
      <Badge variant="destructive" className="top-10 left-1/2 -translate-x-1/2 fixed z-50">
        Application Server Crashed
      </Badge>
    );
  }

  return null;
};

import { useEffect } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { useSettings } from "frontend/store/app/settings.store";
import { useLocation } from "frontend/routing/router";
import { Badge } from "frontend/components/ui/badge";

const handledServerCrash = {
  notified: false,
  handled: true,
};

const onCrash = () => {
  if (handledServerCrash.handled) {
    handledServerCrash.notified = true;
    handledServerCrash.handled = false;
  }
};

export const Crash = () => {
  const { navigate } = useLocation();
  const { setServerStatus, serverStatus } = useSettings(
    useShallow((state) => ({
      setServerStatus: state.setServerStatus,
      serverStatus: state.serverStatus,
    })),
  );

  useEffect(() => {
    // Show toast when server is down
    const showServerDownToast = () => {
      if (!handledServerCrash.notified) return;
      handledServerCrash.notified = false;
      handledServerCrash.handled = false;

      toast("Server is not running", {
        description: "Please start the server to continue",
        duration: Infinity,
        action: {
          label: "Restart Server",
          onClick: async () => {
            handledServerCrash.notified = false;
            handledServerCrash.handled = true;
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
                    navigate({ to: "dashboard.settings" });
                  },
                },
              });
            }
          },
        },
      });
    };

    // Initial status check
    const checkInitialStatus = async () => {
      try {
        const running = await window.electron.server.status();
        if (running) {
          setServerStatus("running");
        } else {
          onCrash();
          setServerStatus("crashed");
          showServerDownToast();
        }
      } catch (error) {
        setServerStatus("crashed");
      }
    };

    checkInitialStatus();

    // Set up listener for server status changes
    const unsubscribe = window.electron.server.onStatusChange((isRunning) => {
      if (isRunning && serverStatus === "crashed") {
        setServerStatus("running");
      } else if (!isRunning && serverStatus !== "crashed") {
        onCrash();
        setServerStatus("crashed");
        showServerDownToast();
      }
    });

    // Clean up the listener on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  if (serverStatus === "crashed") {
    return (
      <Badge variant="destructive" className="top-10 left-1/2 -translate-x-1/2 fixed z-50">
        Application Server Crashed
      </Badge>
    );
  }

  return null;
};

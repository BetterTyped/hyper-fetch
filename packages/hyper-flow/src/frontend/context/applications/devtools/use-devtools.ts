import { useMemo } from "react";
import { createClient } from "@hyper-fetch/core";
import { useShallow } from "zustand/react/shallow";

import { useApplications } from "@/store/applications/apps.store";
import { useConnectionStore } from "@/store/applications/connection.store";
import { useParams } from "@tanstack/react-router";

export const useDevtools = () => {
  const { applicationName } = useParams({ strict: false });
  const application = useApplications(useShallow((state) => state.applications[applicationName as string]));
  const { connections } = useConnectionStore();

  const { client } = useMemo(() => {
    if (connections[applicationName as keyof typeof connections]) {
      return connections[applicationName as keyof typeof connections];
    }
    const newClient = createClient({
      url: application.url,
    });
    return {
      client: newClient,
    };
  }, [connections, applicationName, application.url]);

  return {
    client,
    application,
  };
};

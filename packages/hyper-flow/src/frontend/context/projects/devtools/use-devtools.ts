import { useMemo } from "react";
import { createClient } from "@hyper-fetch/core";
import { useShallow } from "zustand/react/shallow";

import { useRoute } from "frontend/routing/router";
import { useProjects } from "frontend/store/project/projects.store";
import { useConnectionStore } from "frontend/store/project/connection.store";

export const useDevtools = () => {
  const {
    params: { projectName },
  } = useRoute("project");
  const project = useProjects(useShallow((state) => state.projects[projectName]));
  const { connections } = useConnectionStore();

  const { client } = useMemo(() => {
    if (connections[projectName as keyof typeof connections]) {
      return connections[projectName as keyof typeof connections];
    }
    const newClient = createClient({
      url: project.url,
    });
    return {
      client: newClient,
    };
  }, [connections, projectName, project.url]);

  return {
    client,
    project,
  };
};

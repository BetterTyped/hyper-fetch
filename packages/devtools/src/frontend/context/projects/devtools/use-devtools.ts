import { createClient } from "@hyper-fetch/core";

import { useConnections } from "../connection/connection";
import { useRoute } from "frontend/routing/router";
import { useProjects } from "frontend/store/project/projects.store";

export const useDevtools = () => {
  const {
    params: { projectName },
  } = useRoute("project");
  const { projects } = useProjects();
  const { connections } = useConnections("Devtools");

  const { client } = connections[projectName as keyof typeof connections] || {
    client: createClient({
      url: "http://localhost.dummy:3000",
    }),
  };

  return {
    client,
    project: projects[projectName as keyof typeof projects],
  };
};

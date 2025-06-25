import { createFileRoute } from "@tanstack/react-router";

import { ApplicationStart } from "@/pages/applications/start/start";

export const Route = createFileRoute("/applications/$applicationName/")({
  component: ApplicationStart,
});

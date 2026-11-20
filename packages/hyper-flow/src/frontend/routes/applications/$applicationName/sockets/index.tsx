import { createFileRoute } from "@tanstack/react-router";

import { ApplicationSockets } from "@/pages/applications/sockets/sockets";

export const Route = createFileRoute("/applications/$applicationName/sockets/")({
  component: ApplicationSockets,
});

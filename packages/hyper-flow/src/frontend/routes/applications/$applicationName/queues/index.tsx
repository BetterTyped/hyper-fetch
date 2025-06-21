import { createFileRoute } from "@tanstack/react-router";

import { ApplicationQueues } from "@/pages/applications/queues/queues";

export const Route = createFileRoute("/applications/$applicationName/queues/")({
  component: ApplicationQueues,
});

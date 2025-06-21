import { createFileRoute } from "@tanstack/react-router";

import { ApplicationCache } from "@/pages/applications/cache/cache";

export const Route = createFileRoute("/applications/$applicationName/cache/")({
  component: ApplicationCache,
});

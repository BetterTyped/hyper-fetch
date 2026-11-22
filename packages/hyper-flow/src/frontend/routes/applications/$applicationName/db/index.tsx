import { createFileRoute } from "@tanstack/react-router";

import { ApplicationDb } from "@/pages/applications/db/db";

export const Route = createFileRoute("/applications/$applicationName/db/")({
  component: ApplicationDb,
});

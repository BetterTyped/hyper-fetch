import { createFileRoute } from "@tanstack/react-router";

import { ApplicationLayout } from "@/pages/applications/_layout/layout";

export const Route = createFileRoute("/applications/$applicationName")({
  component: ApplicationLayout,
});

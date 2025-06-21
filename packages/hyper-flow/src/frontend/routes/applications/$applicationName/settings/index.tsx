import { createFileRoute } from "@tanstack/react-router";

import { ApplicationSettings } from "@/pages/applications/settings/settings";

export const Route = createFileRoute("/applications/$applicationName/settings/")({
  component: ApplicationSettings,
});

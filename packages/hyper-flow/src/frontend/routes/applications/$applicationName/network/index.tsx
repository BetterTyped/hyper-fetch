import { createFileRoute } from "@tanstack/react-router";

import { ApplicationNetwork } from "@/pages/applications/network/network";

export const Route = createFileRoute("/applications/$applicationName/network/")({
  component: ApplicationNetwork,
});

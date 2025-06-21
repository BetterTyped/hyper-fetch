import { createFileRoute } from "@tanstack/react-router";

import { Settings } from "@/pages/dashboard/settings/settings";

export const Route = createFileRoute("/_dashboard/settings/")({
  component: Settings,
});

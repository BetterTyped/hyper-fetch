import { createFileRoute } from "@tanstack/react-router";

import { DashboardLayout } from "@/pages/dashboard/_layout/layout";

export const Route = createFileRoute("/_dashboard")({
  component: DashboardLayout,
});

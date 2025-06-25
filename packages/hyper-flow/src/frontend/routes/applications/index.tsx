import { createFileRoute } from "@tanstack/react-router";

import { Applications } from "@/pages/dashboard/applications/applications";

export const Route = createFileRoute("/applications/")({
  component: Applications,
});

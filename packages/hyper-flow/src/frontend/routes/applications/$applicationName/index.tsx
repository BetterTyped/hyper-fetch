import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/applications/$applicationName/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/applications/$applicationId/"!</div>;
}

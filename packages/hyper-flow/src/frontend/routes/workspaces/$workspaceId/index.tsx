import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/workspaces/$workspaceId/")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/workspaces/$workspaceId/"!</div>
}

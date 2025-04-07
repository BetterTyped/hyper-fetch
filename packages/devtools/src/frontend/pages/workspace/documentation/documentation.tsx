import { Button } from "frontend/components/ui/button";
import { useRoute } from "frontend/routing/router";
import { useWorkspaces } from "frontend/store/workspace/workspaces.store";
import { EmptyState } from "frontend/components/ui/empty-state";

export const WorkspaceDocumentation = () => {
  const {
    params: { workspaceId },
    navigate,
  } = useRoute("workspace");
  const { workspaces } = useWorkspaces();
  // const { projects } = useOnlineProjects("Details");

  const workspace = workspaces.find((w) => w.id === workspaceId);

  if (!workspace) {
    return (
      <EmptyState title="Workspace not found" description="Please create a workspace first">
        <Button onClick={() => navigate({ to: "dashboard" })}>Create Workspace</Button>
      </EmptyState>
    );
  }

  return <>Documentation</>;
};

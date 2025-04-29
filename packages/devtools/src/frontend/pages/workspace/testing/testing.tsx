import { Button } from "frontend/components/ui/button";
import { useRoute } from "frontend/routing/router";
import { useWorkspaces } from "frontend/store/workspace/workspaces.store";
import { EmptyState } from "frontend/components/no-content/empty-state";

export const WorkspaceTesting = () => {
  const {
    params: { workspaceId },
    navigate,
  } = useRoute("workspace");
  const { workspaces } = useWorkspaces();

  const workspace = workspaces.find((w) => w.id === workspaceId);

  if (!workspace) {
    return (
      <EmptyState title="Workspace not found" description="Please create a workspace first">
        <Button onClick={() => navigate({ to: "dashboard" })}>Create Workspace</Button>
      </EmptyState>
    );
  }

  return <>Testing</>;
};

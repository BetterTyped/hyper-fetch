import { useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { useWorkspaces } from "@/store/workspace/workspaces.store";
import { EmptyState } from "@/components/no-content/empty-state";

export const WorkspaceApis = () => {
  // const { workspaceId } = useParams({ strict: false });
  const workspaceId = "1";
  const { workspaces } = useWorkspaces();
  const navigate = useNavigate();

  const workspace = workspaces.find((w) => w.id === workspaceId);

  if (!workspace) {
    return (
      <EmptyState title="Workspace not found" description="Please create a workspace first">
        <Button onClick={() => navigate({ to: "/" })}>Create Workspace</Button>
      </EmptyState>
    );
  }

  return <>APIS</>;
};

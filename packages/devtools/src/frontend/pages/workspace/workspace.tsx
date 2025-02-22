import { CardButton } from "frontend/components/card-button/card-button";
import { useDevtoolsWorkspaces } from "frontend/pages/_root/devtools.context";

export const Workspace = () => {
  const { activeWorkspace, workspaces } = useDevtoolsWorkspaces("DevtoolsWorkspace");

  const workspace = activeWorkspace ? workspaces[activeWorkspace] : null;
  const name = workspace?.name || "Workspace";

  return (
    <div>
      <h2>{name}</h2>
      <CardButton>Environments</CardButton>
      <CardButton>Options</CardButton>
    </div>
  );
};

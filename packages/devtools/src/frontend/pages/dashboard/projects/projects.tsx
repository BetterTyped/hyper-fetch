import { Button } from "frontend/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "frontend/components/ui/card";
import { useWorkspaces } from "frontend/context/devtools.context";
import { useLocation } from "frontend/routing/router";
import { DashboardLayout } from "../_layout/layout";
import { ProjectCard } from "./_components/project";

export const Projects = () => {
  const { workspaces, setActiveWorkspace } = useWorkspaces("dashboard");

  const { navigate } = useLocation();

  const onOpenWorkspace = (workspaceName: string) => {
    setActiveWorkspace(workspaceName);
    navigate({
      to: "project.workspace",
    });
  };

  return (
    <DashboardLayout>
      {!!Object.values(workspaces).length && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-1 lg:grid-cols-2">
          {Object.values(workspaces).map((workspace) => (
            <ProjectCard
              key={workspace.id}
              id={workspace.id}
              name={workspace.name}
              connectionType={workspace.client.adapter.name}
              isConnected={false}
              onOpenClick={() => onOpenWorkspace(workspace.name)}
              onConnectClick={() => {}}
            />
          ))}
        </div>
      )}
      {!Object.values(workspaces).length && (
        <div className="flex h-full w-full flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-semibold tracking-tight">No workspaces found</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Connect to a new workspace to get started with monitoring your requests
          </p>
        </div>
      )}
    </DashboardLayout>
  );
};

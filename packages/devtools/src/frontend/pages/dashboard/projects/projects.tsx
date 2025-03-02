import { Button } from "frontend/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "frontend/components/ui/card";
import { useWorkspaces } from "frontend/context/devtools.context";
import { useLocation } from "frontend/routing/router";
import { DashboardLayout } from "../_layout/layout";

export const Projects = () => {
  const { workspaces, setActiveWorkspace } = useWorkspaces("dashboard");

  const { navigate } = useLocation();

  const onOpenWorkspace = (workspaceName: string) => {
    setActiveWorkspace(workspaceName);
    navigate({
      to: "project.network",
    });
  };

  return (
    <DashboardLayout>
      {!!Object.values(workspaces).length && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.values(workspaces).map((workspace) => (
            <Card key={workspace.id}>
              <CardHeader>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-ellipsis overflow-hidden">
                    {workspace.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full capitalize" />
                      {workspace.client.adapter.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      Cloud
                    </div>
                  </CardDescription>
                </CardContent>
                <CardFooter className="mt-6">
                  <Button onClick={() => onOpenWorkspace(workspace.name)}>Open</Button>
                </CardFooter>
              </CardHeader>
            </Card>
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

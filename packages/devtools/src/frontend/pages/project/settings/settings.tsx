import { Settings2, Network, AlertTriangle, Trash } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { Section, SectionIcon, SectionHeader, SectionTitle, SectionDescription } from "frontend/components/ui/section";
import { Badge } from "frontend/components/ui/badge";
import { Button } from "frontend/components/ui/button";
import { Input } from "frontend/components/ui/input";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { SimulatedError, useProjects } from "frontend/store/project/projects.store";
import { AddErrorDialog } from "./add-error-dialog";

export const ProjectSettings = () => {
  const { project, client } = useDevtools();
  const settings = useProjects((state) => state.projects[project.name].settings);
  const setSettings = useProjects((state) => state.setSettings);
  const setSimulatedErrors = useProjects((state) => state.setSimulatedErrors);

  const handleAddError = ({ initialName, ...data }: SimulatedError & { initialName?: string }) => {
    const newSimulatedErrors: Record<string, SimulatedError> = { ...settings?.simulatedErrors };
    if (initialName) {
      delete newSimulatedErrors[initialName];
    }
    newSimulatedErrors[data.name] = data;

    setSimulatedErrors(project.name, newSimulatedErrors);
  };

  const handleRemoveError = (errorName: string) => {
    if (errorName === "Default") return; // Don't allow removing default error

    const newSimulatedErrors = { ...settings?.simulatedErrors };
    delete newSimulatedErrors[errorName];

    setSimulatedErrors(project.name, newSimulatedErrors);
  };

  return (
    <Section id="settings" className="flex flex-col px-4 w-full h-full flex-1 overflow-auto">
      <SectionHeader>
        <SectionIcon>
          <Settings2 />
        </SectionIcon>
        <SectionTitle>Project Settings</SectionTitle>
        <SectionDescription>Adjust your project settings here.</SectionDescription>
      </SectionHeader>
      <div className="flex flex-col gap-4 py-4">
        <Card>
          <CardHeader>
            <CardTitle>Client Configuration</CardTitle>
            <CardDescription>Current hyper-fetch settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-md">
                <p className="text-sm font-medium text-muted-foreground">Base URL</p>
                <p className="text-base font-mono truncate">{client.options.url || "Not configured"}</p>
              </div>
              <div className="p-4 border rounded-md">
                <p className="text-sm font-medium text-muted-foreground">Environment</p>
                <p className="text-base">{project?.environment || "Development"}</p>
              </div>
              <div className="p-4 border rounded-md">
                <p className="text-sm font-medium text-muted-foreground">Adapter</p>
                <p className="text-base">{client.adapter.name || "Not configured"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              <CardTitle>Network Settings</CardTitle>
            </div>
            <CardDescription>Configure network history and error simulation</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <h3 className="text-sm font-medium mb-2">Network History Limit</h3>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  value={settings.maxRequestsHistorySize}
                  onChange={(e) => setSettings(project.name, { maxRequestsHistorySize: parseInt(e.target.value, 10) })}
                  className="max-w-[200px]"
                  min="1"
                  max="100000"
                />
                <span className="text-sm text-muted-foreground">entries</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Maximum number of network requests to keep in memory</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <CardTitle>Simulated Errors</CardTitle>
              </div>
              <CardDescription>
                Configure simulated error responses for testing, you can use them to test your error handling
                strategies.
              </CardDescription>
            </div>
            <AddErrorDialog onAddError={handleAddError} />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                {Object.entries(settings?.simulatedErrors || {}).map(([name, error]) => (
                  <div key={name} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{name}</span>
                      <Badge variant="destructive">{error.status}</Badge>
                    </div>
                    {name !== "Default" && (
                      <div className="flex items-center gap-2">
                        <AddErrorDialog onAddError={handleAddError} initialError={error} isEdit />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveError(name)}
                          disabled={name === "Default"}
                        >
                          <Trash className="size-4" />
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Section>
  );
};

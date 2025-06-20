import { Settings2, Network, AlertTriangle, Trash, Server, Globe, Cpu } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Section, SectionIcon, SectionHeader, SectionTitle, SectionDescription } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { SimulatedError, useApplications } from "@/store/applications/apps.store";
import { AddErrorDialog } from "./add-error-dialog";

export const ApplicationSettings = () => {
  const { application, client } = useDevtools();
  const settings = useApplications((state) => state.applications[application.name].settings);
  const setSettings = useApplications((state) => state.setSettings);
  const setSimulatedErrors = useApplications((state) => state.setSimulatedErrors);

  const handleAddError = ({ initialName, ...data }: SimulatedError & { initialName?: string }) => {
    const newSimulatedErrors: Record<string, SimulatedError> = { ...settings?.simulatedErrors };
    if (initialName) {
      delete newSimulatedErrors[initialName];
    }
    newSimulatedErrors[data.name] = data;

    setSimulatedErrors(application.name, newSimulatedErrors);
  };

  const handleRemoveError = (errorName: string) => {
    if (errorName === "Default") return; // Don't allow removing default error

    const newSimulatedErrors = { ...settings?.simulatedErrors };
    delete newSimulatedErrors[errorName];

    setSimulatedErrors(application.name, newSimulatedErrors);
  };

  return (
    <Section id="settings" className="flex flex-col px-6 w-full h-full flex-1 overflow-auto">
      <SectionHeader>
        <SectionIcon className="p-3 rounded-lg">
          <Settings2 />
        </SectionIcon>
        <SectionTitle className="text-2xl font-bold">Application Settings</SectionTitle>
        <SectionDescription className="text-muted-foreground">
          Customize your application configuration and behavior
        </SectionDescription>
      </SectionHeader>
      <div className="flex flex-col gap-6 py-4 w-full">
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-xl">Client Configuration</CardTitle>
            <CardDescription>Current hyper-fetch settings and environment details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 border rounded-xl bg-card/40 duration-200">
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <p className="text-sm font-medium text-muted-foreground">Base URL</p>
                </div>
                <p className="text-base font-mono truncate">{client.options.url || "Not configured"}</p>
              </div>
              <div className="p-6 border rounded-xl bg-card/40 duration-200">
                <div className="flex items-center gap-3 mb-2">
                  <Server className="h-5 w-5 text-primary" />
                  <p className="text-sm font-medium text-muted-foreground">Environment</p>
                </div>
                <p className="text-base">{application?.environment || "Development"}</p>
              </div>
              <div className="p-6 border rounded-xl bg-card/40 duration-200">
                <div className="flex items-center gap-3 mb-2">
                  <Cpu className="h-5 w-5 text-primary" />
                  <p className="text-sm font-medium text-muted-foreground">Adapter</p>
                </div>
                <p className="text-base">{client.adapter.name || "Not configured"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              <CardTitle className="text-xl">Network Settings</CardTitle>
            </div>
            <CardDescription>Configure network history and error simulation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-6 border rounded-xl bg-card/40">
              <h3 className="text-sm font-medium mb-3">Network History Limit</h3>
              <div className="flex gap-3 items-center">
                <Input
                  type="number"
                  value={settings.maxRequestsHistorySize}
                  onChange={(e) =>
                    setSettings(application.name, { maxRequestsHistorySize: parseInt(e.target.value, 10) })
                  }
                  className="max-w-[200px] h-10"
                  min="1"
                  max="100000"
                />
                <span className="text-sm text-muted-foreground">entries</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Maximum number of network requests to keep in memory</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-xl">Simulated Errors</CardTitle>
                </div>
                <CardDescription>
                  Configure simulated error responses for testing your error handling strategies
                </CardDescription>
              </div>
              <AddErrorDialog onAddError={handleAddError} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                {Object.entries(settings?.simulatedErrors || {}).map(([name, error]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between p-4 border rounded-xl bg-card/50 transition-colors duration-200 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-red-500/10 text-red-500">
                        <AlertTriangle className="size-5" />
                        <span className="text-xs font-medium mt-1">{error.status}</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm bg-muted px-3 py-0.5 rounded-md">{name}</span>
                          {name === "Default" && <Badge variant="secondary">System</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {typeof error.body === "object" ? JSON.stringify(error.body) : error.body}
                        </p>
                      </div>
                    </div>
                    {name !== "Default" && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <AddErrorDialog onAddError={handleAddError} initialError={error} isEdit />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveError(name)}
                          className="gap-2"
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

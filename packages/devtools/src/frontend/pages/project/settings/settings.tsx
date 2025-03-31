import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/components/ui/card";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";

export const ProjectSettings = () => {
  const { client } = useDevtools();

  return (
    <div className="flex flex-col gap-4 p-4">
      <Card className="md:col-span-4">
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
              <p className="text-base">Development</p>
            </div>
            <div className="p-4 border rounded-md">
              <p className="text-sm font-medium text-muted-foreground">Adapter</p>
              <p className="text-base">{client.adapter.name || "Not configured"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

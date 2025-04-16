import { AppWindow } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "frontend/components/ui/card";
import { Badge } from "frontend/components/ui/badge";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { cn } from "frontend/lib/utils";
import { AdapterIcon } from "frontend/components/ui/adapter-icon";

export const CardOverview = ({ className }: { className?: string }) => {
  const { client } = useDevtools();

  const type = "Application";

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AppWindow className="h-5 w-5" />
          Project Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Adapter Type</h3>
          <div className="flex items-center gap-2">
            <Badge variant="default">
              <AdapterIcon name={client.adapter.name} />
              {client.adapter.name}
            </Badge>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Environment</h3>
          <Badge variant="secondary">{type || "Frontend Application"}</Badge>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Base URL</h3>
          <p className="font-medium text-sm truncate">{client.url || "Not configured"}</p>
        </div>
      </CardContent>
    </Card>
  );
};

import { useParams } from "@tanstack/react-router";
import { FolderOpen, BookText, Gauge, Database } from "lucide-react";

import { CacheDashboard } from "./cache/cache";
import { GeneralDashboard } from "./general/general";
import { PerformanceDashboard } from "./performance/performance";
import { Badge } from "@/components/ui/badge";
import {
  Section,
  SectionActions,
  SectionDescription,
  SectionHeader,
  SectionIcon,
  SectionTitle,
} from "@/components/ui/section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApplications } from "@/store/applications/apps.store";

export const ApplicationStart = () => {
  const { applicationName } = useParams({ strict: false });
  // The application layout renders pages only for known applications
  const application = useApplications((state) => state.applications[applicationName as string]);

  return (
    <Section id="application-details" className="h-full space-y-2 px-4 overflow-auto">
      <SectionHeader sticky>
        <SectionIcon>
          <FolderOpen className="h-6 w-6 text-zinc-400" />
        </SectionIcon>
        <SectionTitle className="text-2xl flex items-center gap-2">{application.name}</SectionTitle>
        <SectionDescription className="-mt-1 flex items-center gap-2">
          {application.url || "Not configured"}
        </SectionDescription>
        {application.environment !== application.name && (
          <SectionActions>
            <Badge variant="outline" data-testid="application-environment">
              {application.environment}
            </Badge>
          </SectionActions>
        )}
      </SectionHeader>

      <Tabs defaultValue="general" className="w-full pb-4">
        <TabsList className="mb-2 gap-2">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <BookText className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="cache" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Cache
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralDashboard />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceDashboard />
        </TabsContent>

        <TabsContent value="cache">
          <CacheDashboard />
        </TabsContent>
      </Tabs>
    </Section>
  );
};

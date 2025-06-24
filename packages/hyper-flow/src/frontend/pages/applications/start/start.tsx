import { useParams } from "@tanstack/react-router";
import { FolderOpen, BookText, Gauge, Database } from "lucide-react";

import { GeneralDashboard } from "./general/general";
import { PerformanceDashboard } from "./performance/performance";
import { CacheDashboard } from "./cache/cache";

import { useApplications } from "@/store/applications/apps.store";
import { EmptyState } from "@/components/no-content/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Section,
  SectionActions,
  SectionDescription,
  SectionHeader,
  SectionIcon,
  SectionTitle,
} from "@/components/ui/section";
// import { Environments } from "./environments/environments";

export const ApplicationStart = () => {
  const { applicationName } = useParams({ strict: false });
  const { applications } = useApplications();
  const application = applications[applicationName as string];
  const iconUrl = "";

  if (!application) {
    return <EmptyState title="Application not found" description="Please connect to a application first" />;
  }

  return (
    <Section id="application-details" className="h-full space-y-2 px-4 overflow-auto">
      <SectionHeader sticky>
        <SectionIcon>
          {iconUrl ? (
            <img src={iconUrl} alt={`${application.name} icon`} className="w-full h-full object-cover" />
          ) : (
            <FolderOpen className="h-6 w-6 text-zinc-400" />
          )}
        </SectionIcon>
        <SectionTitle className="text-2xl flex items-center gap-2">{application.name}</SectionTitle>
        <SectionDescription className="-mt-1 flex items-center gap-2">
          {application.url || "Not configured"}
        </SectionDescription>
        <SectionActions>{/* <Environments /> */}</SectionActions>
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

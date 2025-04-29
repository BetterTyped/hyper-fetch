import { FolderOpen, BookText, Gauge, Database } from "lucide-react";

import { useRoute } from "frontend/routing/router";
import { useProjects } from "frontend/store/project/projects.store";
import { EmptyState } from "frontend/components/no-content/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "frontend/components/ui/tabs";
import { GeneralDashboard } from "./general/general";
import { PerformanceDashboard } from "./performance/performance";
import { CacheDashboard } from "./cache/cache";
import {
  Section,
  SectionActions,
  SectionDescription,
  SectionHeader,
  SectionIcon,
  SectionTitle,
} from "frontend/components/ui/section";
// import { Environments } from "./environments/environments";

export const ProjectStart = () => {
  const {
    params: { projectName },
  } = useRoute("project");
  const { projects } = useProjects();
  const project = projects[projectName];
  const iconUrl = "";

  if (!project) {
    return <EmptyState title="Project not found" description="Please connect to a project first" />;
  }

  return (
    <Section id="project-details" className="h-full space-y-2 px-4 overflow-auto">
      <SectionHeader sticky>
        <SectionIcon>
          {iconUrl ? (
            <img src={iconUrl} alt={`${project.name} icon`} className="w-full h-full object-cover" />
          ) : (
            <FolderOpen className="h-6 w-6 text-gray-400" />
          )}
        </SectionIcon>
        <SectionTitle className="text-2xl flex items-center gap-2">{project.name}</SectionTitle>
        <SectionDescription className="-mt-1 flex items-center gap-2">
          {project.url || "Not configured"}
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

import { FolderOpen } from "lucide-react";

import { useRoute } from "frontend/routing/router";
import { useProjects } from "frontend/store/project/projects.store";
import { EmptyState } from "frontend/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "frontend/components/ui/tabs";
import { GeneralDashboard } from "./general/general";
import { PerformanceDashboard } from "./performance/performance";
import { CacheDashboard } from "./cache/cache";
import { Errors } from "./errors/errors";
import {
  Section,
  SectionActions,
  SectionDescription,
  SectionHeader,
  SectionIcon,
  SectionTitle,
} from "frontend/components/ui/section";
import { Environments } from "./environments/environments";
import { AdapterIcon } from "frontend/components/ui/adapter-icon";
import { Badge } from "frontend/components/ui/badge";

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
          <Badge variant="secondary">
            <AdapterIcon name={project.adapterName} />
            {project.adapterName}
          </Badge>
        </SectionDescription>
        <SectionActions>
          <Environments />
        </SectionActions>
      </SectionHeader>

      <Tabs defaultValue="general" className="w-full pb-4">
        <TabsList className="mb-2 gap-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
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

        <TabsContent value="errors">
          <Errors />
        </TabsContent>
      </Tabs>
    </Section>
  );
};

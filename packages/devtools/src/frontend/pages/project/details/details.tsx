import { FolderOpen } from "lucide-react";

import { useRoute } from "frontend/routing/router";
import { useProjects } from "frontend/store/project/projects.store";
import { EmptyState } from "frontend/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "frontend/components/ui/tabs";
import { GeneralDashboard } from "./general/general";
import { PerformanceDashboard } from "./performance/performance";
import { CacheDashboard } from "./cache/cache";
import { BottleneckAnalyzer } from "./bottlenecks/bottleneck";
import { Section, SectionHeader, SectionIcon, SectionTitle } from "frontend/components/ui/section";

export const ProjectDetails = () => {
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
    <Section id="project-details" className="space-y-2">
      <SectionHeader>
        <SectionIcon>
          {iconUrl ? (
            <img src={iconUrl} alt={`${project.name} icon`} className="w-full h-full object-cover" />
          ) : (
            <FolderOpen className="h-6 w-6 text-gray-400" />
          )}
        </SectionIcon>
        <SectionTitle className="text-2xl">{project.name}</SectionTitle>
        <div className="absolute right-2">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Application</span>
        </div>
      </SectionHeader>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-2 gap-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
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

        <TabsContent value="bottlenecks">
          <BottleneckAnalyzer />
        </TabsContent>
      </Tabs>
    </Section>
  );
};

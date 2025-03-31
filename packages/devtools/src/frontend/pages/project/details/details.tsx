import { useRoute } from "frontend/routing/router";
import { useProjects } from "frontend/store/projects.store";
import { EmptyState } from "frontend/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "frontend/components/ui/tabs";
import { General } from "./components/general";
import { PerformanceDashboard } from "./components/PerformanceDashboard";
import { CacheAnalytics } from "./components/CacheAnalytics";
import { NetworkTraffic } from "./components/NetworkTraffic";
import { BottleneckAnalyzer } from "./components/BottleneckAnalyzer";

export const ProjectDetails = () => {
  const {
    params: { projectName },
  } = useRoute("project");
  const { projects } = useProjects();
  const project = projects[projectName];

  if (!project) {
    return <EmptyState title="Project not found" description="Please connect to a project first" />;
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Application</span>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-2 gap-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <General project={project} />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceDashboard project={project} />
        </TabsContent>

        <TabsContent value="cache">
          <CacheAnalytics project={project} />
        </TabsContent>

        <TabsContent value="network">
          <NetworkTraffic project={project} />
        </TabsContent>

        <TabsContent value="bottlenecks">
          <BottleneckAnalyzer project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

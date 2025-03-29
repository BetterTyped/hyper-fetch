import { useRoute } from "frontend/routing/router";
import { useProjects } from "frontend/store/projects.store";
import { EmptyState } from "frontend/components/ui/empty-state";

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
    <div>
      <h1>Project Details</h1>
    </div>
  );
};

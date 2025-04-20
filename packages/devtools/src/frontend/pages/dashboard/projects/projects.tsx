import { FolderCode } from "lucide-react";

import { useLocation } from "frontend/routing/router";
import { useProjects } from "frontend/store/project/projects.store";
import { ProjectCard } from "frontend/components/ui/project-card";
import { Tutorial } from "./components/tutorial";
import { Section, SectionDescription, SectionHeader, SectionIcon, SectionTitle } from "frontend/components/ui/section";

export const Projects = () => {
  const projects = useProjects((state) => state.projects);
  const { navigate } = useLocation();

  const onOpenProject = (projectName: string) => {
    navigate({
      to: "project",
      params: {
        projectName,
      },
    });
  };

  return (
    <Section id="projects" className="h-full px-4 overflow-auto">
      <SectionHeader sticky>
        <SectionIcon>
          <FolderCode />
        </SectionIcon>
        <SectionTitle>Projects</SectionTitle>
        <SectionDescription>Manage your projects and connect them to your workspace.</SectionDescription>
      </SectionHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.values(projects).map((project) => (
          <ProjectCard key={project.name} iconUrl="" {...project} onOpen={() => onOpenProject(project.name)} />
        ))}
        <Tutorial />
      </div>
    </Section>
  );
};

import { Earth, Server, Database, FolderCode } from "lucide-react";

import { useLocation } from "frontend/routing/router";
import { useProjects } from "frontend/store/project/projects.store";
import { ProjectCard } from "frontend/components/ui/project-card";
import { KpiCard1 } from "frontend/components/ui/kpi-card-2";
import { Tutorial } from "./components/tutorial";
import {
  Section,
  SectionDescription,
  SectionGroup,
  SectionHeader,
  SectionIcon,
  SectionSubtitle,
  SectionTitle,
} from "frontend/components/ui/section";

export const Projects = () => {
  const projects = useProjects((state) => state.projects);
  const { navigate } = useLocation();
  const messageCount = 0;

  const onOpenProject = (projectName: string) => {
    navigate({
      to: "project",
      params: {
        projectName,
      },
    });
  };

  return (
    <Section id="projects">
      <SectionHeader>
        <SectionIcon>
          <FolderCode />
        </SectionIcon>
        <SectionTitle>Projects</SectionTitle>
        <SectionDescription>Manage your projects and connect them to your workspace.</SectionDescription>
      </SectionHeader>
      <div className="mb-1">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <KpiCard1 value={9} label="Active Projects" icon={<Server className="h-5 w-5" />} color="yellow">
            {/* <span className="text-sm font-medium">+2</span> new projects this week */}
          </KpiCard1>

          <KpiCard1 value={messageCount} label="Requests" icon={<Earth className="h-5 w-5" />} color="blue">
            {/* <span className="font-medium">15</span> requests per minute */}
          </KpiCard1>

          <KpiCard1 value={127} label="Saved Mocks" icon={<Database className="h-5 w-5" />} color="green">
            {/* <span className="font-medium">8</span> new mocks today */}
          </KpiCard1>
        </div>
      </div>

      <SectionGroup>
        <SectionSubtitle>Active projects</SectionSubtitle>
        <SectionDescription>Here are the projects that are currently active in your workspace.</SectionDescription>
      </SectionGroup>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.values(projects).map((project) => (
          <ProjectCard key={project.name} iconUrl="" {...project} onOpen={() => onOpenProject(project.name)} />
        ))}
        <Tutorial />
      </div>
    </Section>
  );
};

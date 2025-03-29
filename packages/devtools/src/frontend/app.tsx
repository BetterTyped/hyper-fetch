import { Application } from "./routing/router";
import { ProjectsProvider } from "./context/projects/projects";

export function App() {
  return (
    <ProjectsProvider>
      <Application />
    </ProjectsProvider>
  );
}

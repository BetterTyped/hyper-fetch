import { Toaster } from "frontend/components/ui/sonner";
import { Application } from "./routing/router";
import { ProjectsProvider } from "./context/projects/projects";

export function App() {
  return (
    <ProjectsProvider>
      <Application />
      <Toaster />
    </ProjectsProvider>
  );
}

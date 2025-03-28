import { Layout } from "./components/layout/layout";
import { Application } from "./routing/router";
import { ProjectsProvider } from "./context/projects/projects";

export function App() {
  return (
    <Layout>
      <ProjectsProvider>
        <Application />
      </ProjectsProvider>
    </Layout>
  );
}

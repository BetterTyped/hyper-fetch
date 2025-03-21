import { DevtoolsOnlineProjects } from "frontend/context/devtools.context";
import { Layout } from "./components/layout/layout";
import { useOnlineProjects } from "./hooks/use-connect-workspaces";
import { Route } from "./routing/router";

export function App() {
  const { projects, setProjects } = useOnlineProjects();

  const setRequestList = (projectId: string, requestList: any) => {
    setProjects((draft) => {
      const selectedProject = draft[projectId];
      if (selectedProject) {
        selectedProject.requests = requestList;
      }
    });
  };

  return (
    <Layout>
      <DevtoolsOnlineProjects projects={projects} setRequestList={setRequestList}>
        <Route to="dashboard" />
        <Route to="dashboard.projects" />
        <Route to="dashboard.onlineProjects" />
        <Route to="dashboard.members" />
        <Route to="dashboard.settings" />
        <Route to="dashboard.activities" />
        <Route to="dashboard.favorites" />
        <Route to="dashboard.recentlyVisited" />
        <Route to="workspace" />
        <Route to="workspace.network" />
        <Route to="workspace.cache" />
        <Route to="workspace.queues" />
        <Route to="workspace.settings" />
        {/* {activeWorkspace && workspaces[activeWorkspace] && (
          <Devtools workspace={activeWorkspace} client={workspaces[activeWorkspace].client} />
        )} */}
        {/* TODO NO CONTENT */}
      </DevtoolsOnlineProjects>
    </Layout>
  );
}

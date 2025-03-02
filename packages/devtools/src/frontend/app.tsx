import { DevtoolsWorkspaces } from "frontend/context/devtools.context";
import { Layout } from "./components/layout/layout";
import { useConnectWorkspaces } from "./hooks/use-connect-workspaces";
import { Route } from "./routing/router";

export function App() {
  const { workspaces, setWorkspaces, activeWorkspace, setActiveWorkspace } = useConnectWorkspaces();

  const setRequestList = (workspaceName: string, requestList: any) => {
    setWorkspaces((draft) => {
      const selectedWorkspace = draft[workspaceName];
      if (selectedWorkspace) {
        selectedWorkspace.requests = requestList;
      }
    });
  };

  return (
    <Layout>
      <DevtoolsWorkspaces
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        setActiveWorkspace={setActiveWorkspace}
        setRequestList={setRequestList}
      >
        <Route to="dashboard" />
        <Route to="project" />
        <Route to="dashboard.projects" />
        <Route to="dashboard.resources" />
        <Route to="dashboard.members" />
        <Route to="dashboard.settings" />
        <Route to="dashboard.activities" />
        <Route to="dashboard.favorites" />
        <Route to="dashboard.recentlyVisited" />
        <Route to="project.workspace" />
        <Route to="project.network" />
        <Route to="project.cache" />
        <Route to="project.queues" />
        <Route to="project.settings" />
        {/* {activeWorkspace && workspaces[activeWorkspace] && (
          <Devtools workspace={activeWorkspace} client={workspaces[activeWorkspace].client} />
        )} */}
        {/* TODO NO CONTENT */}
      </DevtoolsWorkspaces>
    </Layout>
  );
}

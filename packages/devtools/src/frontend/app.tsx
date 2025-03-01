import { DevtoolsWorkspaces } from "frontend/pages/devtools/devtools.context";
import { Layout } from "./components/layout/layout";
import { useDevtoolsWorkspaces } from "./hooks/use-devtools-workspaces";
import { Link, Route } from "./routing/router";

export function App() {
  const { workspaces, setWorkspaces, activeWorkspace, setActiveWorkspace } = useDevtoolsWorkspaces();

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
        <Link to="dashboard">Dashboard</Link>
        <Link to="workspace">Workspace</Link>

        <Route to="dashboard" />
        <Route to="workspace" />
        <Route to="devtools" />
        <Route to="devtools.network" />
        <Route to="devtools.cache" />
        <Route to="devtools.queues" />
        {/* {activeWorkspace && workspaces[activeWorkspace] && (
          <Devtools workspace={activeWorkspace} client={workspaces[activeWorkspace].client} />
        )} */}
        {/* TODO NO CONTENT */}
      </DevtoolsWorkspaces>
    </Layout>
  );
}

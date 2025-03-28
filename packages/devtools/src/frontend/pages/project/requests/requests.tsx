import { ExplorerSidebar } from "./list/explorer.sidebar";
import { ExplorerDetails } from "./details/explorer.details";
import { Content } from "frontend/components/content/content";
import { ProjectLayout } from "../_layout/layout";
import { ExplorerContext } from "./requests.context";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { DevtoolsDataProvider } from "./list/content.state";

export const ProjectRequests = () => {
  const {
    state: { explorerRequests },
  } = useDevtools();

  return (
    <ExplorerContext treeState={new DevtoolsDataProvider(explorerRequests)}>
      <ProjectLayout>
        <Content>
          <ExplorerSidebar />
          <ExplorerDetails />
        </Content>
      </ProjectLayout>
    </ExplorerContext>
  );
};

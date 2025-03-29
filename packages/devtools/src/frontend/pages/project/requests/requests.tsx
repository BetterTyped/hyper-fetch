import { ExplorerSidebar } from "./list/explorer.sidebar";
import { ExplorerDetails } from "./details/explorer.details";
import { ExplorerContext } from "./requests.context";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { DevtoolsDataProvider } from "./list/content.state";

export const ProjectRequests = () => {
  const {
    state: { explorerRequests },
  } = useDevtools();

  return (
    <ExplorerContext treeState={new DevtoolsDataProvider(explorerRequests)}>
      <div className="flex relative flex-1 h-full">
        <ExplorerSidebar />
        <ExplorerDetails />
      </div>
    </ExplorerContext>
  );
};

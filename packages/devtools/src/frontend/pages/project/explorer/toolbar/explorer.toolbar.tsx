import { Toolbar } from "frontend/components/toolbar/toolbar";
import { Search } from "frontend/components/search/search";
import { useDevtoolsContext } from "frontend/pages/project/_context/devtools.context";

export const ExplorerToolbar = () => {
  const { setExplorerSearchTerm } = useDevtoolsContext("ToolbarExplorer");

  return (
    <Toolbar>
      <Search placeholder="Search" onChange={(e) => setExplorerSearchTerm(e.target.value)} />
      <div style={{ flex: "1 1 auto" }} />
    </Toolbar>
  );
};

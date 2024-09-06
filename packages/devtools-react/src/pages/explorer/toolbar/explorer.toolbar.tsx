import { Toolbar } from "components/toolbar/toolbar";
import { Search } from "components/search/search";
import { useDevtoolsContext } from "devtools.context";

export const ExplorerToolbar = () => {
  const { setExplorerSearchTerm } = useDevtoolsContext("ToolbarExplorer");

  return (
    <Toolbar>
      <Search placeholder="Search" onChange={(e) => setExplorerSearchTerm(e.target.value)} />
      <div style={{ flex: "1 1 auto" }} />
    </Toolbar>
  );
};

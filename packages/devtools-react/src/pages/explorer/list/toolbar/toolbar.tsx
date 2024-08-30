import { Options } from "components/options/options";
import { Search } from "components/search/search";
import { useDevtoolsContext } from "devtools.context";

export const Toolbar = () => {
  const { setExplorerSearchTerm } = useDevtoolsContext("ToolbarExplorer");

  return (
    <Options>
      <Search placeholder="Search" onChange={(e) => setExplorerSearchTerm(e.target.value)} />
      <div style={{ flex: "1 1 auto" }} />
    </Options>
  );
};

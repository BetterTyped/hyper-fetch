import { useDevtoolsContext } from "../../../devtools.context";
import { Options } from "../../../components/options/options";
import { Search } from "../../../components/search/search";
import { Button } from "components/button/button";
import { ImportIcon } from "icons/import";

export const Toolbar = () => {
  const { setExplorerSearchTerm } = useDevtoolsContext("ToolbarExplorer");

  return (
    <Options>
      <Search placeholder="Search" onChange={(e) => setExplorerSearchTerm(e.target.value)} />
      <div style={{ flex: "1 1 auto" }} />
      <Button color="gray">
        <ImportIcon />
        Import Request
      </Button>
    </Options>
  );
};

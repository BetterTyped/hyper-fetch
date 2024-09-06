import { Toolbar } from "components/toolbar/toolbar";
import { Search } from "components/search/search";
import { useDevtoolsContext } from "devtools.context";

export const QueuesToolbar = () => {
  const { setProcessingSearchTerm } = useDevtoolsContext("DevtoolsQueuesToolbar");

  return (
    <Toolbar>
      <Search placeholder="Search" onChange={(e) => setProcessingSearchTerm(e.target.value)} />
    </Toolbar>
  );
};

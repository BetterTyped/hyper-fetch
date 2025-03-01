import { Toolbar } from "frontend/components/toolbar/toolbar";
import { Search } from "frontend/components/search/search";
import { useDevtoolsContext } from "frontend/pages/devtools/devtools.context";

export const QueuesToolbar = () => {
  const { setProcessingSearchTerm } = useDevtoolsContext("DevtoolsQueuesToolbar");

  return (
    <Toolbar>
      <Search placeholder="Search" onChange={(e) => setProcessingSearchTerm(e.target.value)} />
    </Toolbar>
  );
};

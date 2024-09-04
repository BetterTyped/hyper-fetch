import { Options } from "components/options/options";
import { Search } from "components/search/search";
import { useDevtoolsContext } from "devtools.context";

export const QueuesToolbar = () => {
  const { setProcessingSearchTerm } = useDevtoolsContext("DevtoolsQueuesToolbar");

  return (
    <Options>
      <Search placeholder="Search" onChange={(e) => setProcessingSearchTerm(e.target.value)} />
    </Options>
  );
};

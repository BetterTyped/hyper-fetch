import { Options } from "components/options/options";
import { Search } from "components/search/search";
import { useDevtoolsContext } from "devtools.context";

export const CacheToolbar = () => {
  const { setCacheSearchTerm } = useDevtoolsContext("DevtoolsCacheToolbar");

  return (
    <Options>
      <Search placeholder="Search" onChange={(e) => setCacheSearchTerm(e.target.value)} />
      {/* Options: Show active - only with emitter observers (hooks) */}
    </Options>
  );
};

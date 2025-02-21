import { Toolbar } from "frontend/components/toolbar/toolbar";
import { Search } from "frontend/components/search/search";
import { useDevtoolsContext } from "frontend/devtools.context";

export const CacheToolbar = () => {
  const { setCacheSearchTerm } = useDevtoolsContext("DevtoolsCacheToolbar");

  return (
    <Toolbar>
      <Search placeholder="Search" onChange={(e) => setCacheSearchTerm(e.target.value)} />
      {/* Toolbar: Show active - only with emitter observers (hooks) */}
    </Toolbar>
  );
};

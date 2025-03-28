import { Toolbar } from "frontend/components/toolbar/toolbar";
import { Search } from "frontend/components/search/search";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";

export const CacheToolbar = () => {
  const { setCacheSearchTerm } = useDevtools();

  return (
    <Toolbar>
      <Search placeholder="Search" onChange={(e) => setCacheSearchTerm(e.target.value)} />
      {/* Toolbar: Show active - only with emitter observers (hooks) */}
    </Toolbar>
  );
};

import { Toolbar } from "frontend/components/toolbar/toolbar";
import { Search } from "frontend/components/search/search";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";

export const ExplorerToolbar = () => {
  const { setExplorerSearchTerm } = useDevtools();

  return (
    <Toolbar>
      <Search placeholder="Search" onChange={(e) => setExplorerSearchTerm(e.target.value)} />
      <div style={{ flex: "1 1 auto" }} />
    </Toolbar>
  );
};

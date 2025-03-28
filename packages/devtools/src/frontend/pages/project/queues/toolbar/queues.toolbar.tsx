import { Toolbar } from "frontend/components/toolbar/toolbar";
import { Search } from "frontend/components/search/search";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";

export const QueuesToolbar = () => {
  const { setProcessingSearchTerm } = useDevtools();

  return (
    <Toolbar>
      <Search placeholder="Search" onChange={(e) => setProcessingSearchTerm(e.target.value)} />
    </Toolbar>
  );
};

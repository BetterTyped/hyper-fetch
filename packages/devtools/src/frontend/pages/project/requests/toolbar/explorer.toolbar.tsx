import { Toolbar } from "frontend/components/toolbar/toolbar";
import { Input } from "frontend/components/ui/input";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";

export const ExplorerToolbar = () => {
  const { setExplorerSearchTerm } = useDevtools();

  return (
    <Toolbar>
      <Input placeholder="Search" onChange={(e) => setExplorerSearchTerm(e.target.value)} />
      <div style={{ flex: "1 1 auto" }} />
    </Toolbar>
  );
};

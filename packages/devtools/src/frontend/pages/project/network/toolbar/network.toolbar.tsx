import { ListXIcon } from "lucide-react";

import { Toolbar } from "frontend/components/toolbar/toolbar";
import { Search } from "frontend/components/search/search";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { Button } from "frontend/components/button/button";

export const NetworkToolbar = () => {
  const { setNetworkSearchTerm, clearNetwork } = useDevtools();

  return (
    <Toolbar>
      <Search placeholder="Search" onChange={(e) => setNetworkSearchTerm(e.target.value)} />
      <div className="flex-1" />
      <Button color="gray" onClick={clearNetwork}>
        <ListXIcon />
        Clear network
      </Button>
    </Toolbar>
  );
};

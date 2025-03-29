import { ListXIcon } from "lucide-react";

import { Toolbar } from "frontend/components/toolbar/toolbar";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { Button } from "frontend/components/button/button";
import { Input } from "frontend/components/ui/input";

export const NetworkToolbar = () => {
  const { setNetworkSearchTerm, clearNetwork } = useDevtools();

  return (
    <Toolbar>
      <Input placeholder="Search" onChange={(e) => setNetworkSearchTerm(e.target.value)} />
      <div className="flex-1" />
      <Button color="gray" onClick={clearNetwork}>
        <ListXIcon />
        Clear network
      </Button>
    </Toolbar>
  );
};

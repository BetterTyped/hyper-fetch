import { ListXIcon } from "lucide-react";

import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { Button } from "frontend/components/ui/button";
import { Input } from "frontend/components/ui/input";

export const NetworkToolbar = () => {
  const { setNetworkSearchTerm, clearNetwork } = useDevtools();

  return (
    <>
      <Input placeholder="Search" onChange={(e) => setNetworkSearchTerm(e.target.value)} />
      <div className="flex-1" />
      <Button color="gray" onClick={clearNetwork}>
        <ListXIcon />
        Clear network
      </Button>
    </>
  );
};

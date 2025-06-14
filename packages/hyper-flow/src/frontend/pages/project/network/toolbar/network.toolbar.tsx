import { ListXIcon } from "lucide-react";

import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { Button } from "frontend/components/ui/button";
import { Input } from "frontend/components/ui/input";
import { useNetworkStore } from "frontend/store/project/network.store";

export const NetworkToolbar = () => {
  const { project } = useDevtools();
  const setNetworkSearchTerm = useNetworkStore((state) => state.setNetworkSearchTerm);
  const clearNetwork = useNetworkStore((state) => state.clearNetwork);

  return (
    <>
      <Input
        placeholder="Search"
        onChange={(e) => setNetworkSearchTerm({ project: project.name, searchTerm: e.target.value })}
      />
      <div className="flex-1" />
      <Button color="gray" onClick={() => clearNetwork({ project: project.name })}>
        <ListXIcon />
        Clear network
      </Button>
    </>
  );
};

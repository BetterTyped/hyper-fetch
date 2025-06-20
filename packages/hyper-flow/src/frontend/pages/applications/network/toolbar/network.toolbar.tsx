import { ListXIcon } from "lucide-react";

import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNetworkStore } from "@/store/applications/network.store";

export const NetworkToolbar = () => {
  const { application } = useDevtools();
  const setNetworkSearchTerm = useNetworkStore((state) => state.setNetworkSearchTerm);
  const clearNetwork = useNetworkStore((state) => state.clearNetwork);

  return (
    <>
      <Input
        placeholder="Search"
        onChange={(e) => setNetworkSearchTerm({ application: application.name, searchTerm: e.target.value })}
      />
      <div className="flex-1" />
      <Button color="gray" onClick={() => clearNetwork({ application: application.name })}>
        <ListXIcon />
        Clear network
      </Button>
    </>
  );
};

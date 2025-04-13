import { XIcon } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Button } from "frontend/components/ui/button";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { useNetworkStore } from "frontend/store/project/network.store";

export const Back = () => {
  const { project } = useDevtools();
  const { openDetails } = useNetworkStore(
    useShallow((state) => ({
      openDetails: state.openDetails,
    })),
  );

  return (
    <Button variant="ghost" size="icon" onClick={() => openDetails({ project: project.name, requestId: "" })}>
      <XIcon className="h-4 w-4" />
    </Button>
  );
};

import { XIcon } from "lucide-react";

import { Button } from "frontend/components/ui/button";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { useQueueStore } from "frontend/store/project/queue.store";

export const Back = () => {
  const { project } = useDevtools();
  const closeDetails = useQueueStore((state) => state.closeDetails);

  return (
    <Button variant="ghost" size="icon" onClick={() => closeDetails(project.name)}>
      <XIcon />
    </Button>
  );
};

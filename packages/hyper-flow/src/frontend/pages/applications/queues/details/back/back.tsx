import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { useQueueStore } from "@/store/applications/queue.store";

export const Back = () => {
  const { application } = useDevtools();
  const closeDetails = useQueueStore((state) => state.closeDetails);

  return (
    <Button variant="ghost" size="icon" onClick={() => closeDetails(application.name)}>
      <XIcon />
    </Button>
  );
};

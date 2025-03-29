import { XIcon } from "lucide-react";

import { Button } from "frontend/components/ui/button";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";

export const Back = () => {
  const { setDetailsExplorerRequest } = useDevtools();

  return (
    <Button variant="ghost" size="icon" onClick={() => setDetailsExplorerRequest(null)}>
      <XIcon />
    </Button>
  );
};

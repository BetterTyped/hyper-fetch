import { XIcon } from "lucide-react";

import { Button } from "frontend/components/ui/button";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";

export const Back = () => {
  const { setDetailsRequestId } = useDevtools();
  return (
    <Button variant="ghost" size="icon" onClick={() => setDetailsRequestId(null)}>
      <XIcon className="h-4 w-4" />
    </Button>
  );
};

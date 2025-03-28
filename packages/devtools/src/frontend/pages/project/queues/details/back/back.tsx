import { XIcon } from "lucide-react";

import { IconButton } from "frontend/components/icon-button/icon-button";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";

export const Back = () => {
  const { setDetailsQueueKey } = useDevtools();
  return (
    <IconButton onClick={() => setDetailsQueueKey(null)}>
      <XIcon />
    </IconButton>
  );
};

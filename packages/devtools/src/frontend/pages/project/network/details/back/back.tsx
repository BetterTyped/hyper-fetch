import { XIcon } from "lucide-react";

import { IconButton } from "frontend/components/icon-button/icon-button";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";

export const Back = () => {
  const { setDetailsRequestId } = useDevtools();
  return (
    <IconButton onClick={() => setDetailsRequestId(null)}>
      <XIcon />
    </IconButton>
  );
};

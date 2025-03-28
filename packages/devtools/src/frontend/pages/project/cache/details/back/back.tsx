import { XIcon } from "lucide-react";

import { IconButton } from "frontend/components/icon-button/icon-button";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";

export const Back = () => {
  const { setDetailsCacheKey } = useDevtools();
  return (
    <IconButton onClick={() => setDetailsCacheKey(null)}>
      <XIcon />
    </IconButton>
  );
};

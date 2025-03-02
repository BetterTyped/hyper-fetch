import { XIcon } from "lucide-react";

import { IconButton } from "frontend/components/icon-button/icon-button";
import { useDevtoolsContext } from "frontend/pages/project/_context/devtools.context";

export const Back = () => {
  const { setDetailsCacheKey } = useDevtoolsContext("DevtoolsNetworkBack");
  return (
    <IconButton onClick={() => setDetailsCacheKey(null)}>
      <XIcon />
    </IconButton>
  );
};

import { XIcon } from "lucide-react";

import { IconButton } from "frontend/components/icon-button/icon-button";
import { useDevtoolsContext } from "frontend/pages/workspace/_context/devtools.context";

export const Back = () => {
  const { setDetailsExplorerRequest } = useDevtoolsContext("DevtoolsNetworkBack");

  return (
    <IconButton onClick={() => setDetailsExplorerRequest(null)}>
      <XIcon />
    </IconButton>
  );
};

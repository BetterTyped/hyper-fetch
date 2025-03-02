import { XIcon } from "lucide-react";

import { IconButton } from "frontend/components/icon-button/icon-button";
import { useDevtoolsContext } from "frontend/pages/project/_context/devtools.context";

export const Back = () => {
  const { setDetailsRequestId } = useDevtoolsContext("DevtoolsNetworkBack");
  return (
    <IconButton onClick={() => setDetailsRequestId(null)}>
      <XIcon />
    </IconButton>
  );
};

import { XIcon } from "lucide-react";

import { IconButton } from "components/icon-button/icon-button";
import { useDevtoolsContext } from "devtools.context";

export const Back = () => {
  const { setDetailsRequestId } = useDevtoolsContext("DevtoolsNetworkBack");
  return (
    <IconButton onClick={() => setDetailsRequestId(null)}>
      <XIcon />
    </IconButton>
  );
};

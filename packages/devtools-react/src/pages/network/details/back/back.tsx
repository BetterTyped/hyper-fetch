import { IconButton } from "components/icon-button/icon-button";
import { useDevtoolsContext } from "devtools.context";
import { BackIcon } from "icons/back";

export const Back = () => {
  const { setDetailsRequestId } = useDevtoolsContext("DevtoolsNetworkBack");
  return (
    <IconButton onClick={() => setDetailsRequestId(null)}>
      <BackIcon fill="rgb(135, 139, 145)" />
    </IconButton>
  );
};

import { IconButton } from "components/icon-button/icon-button";
import { useDevtoolsContext } from "devtools.context";
import { CloseIcon } from "icons/close";

export const Back = () => {
  const { setDetailsRequestId } = useDevtoolsContext("DevtoolsNetworkBack");
  return (
    <IconButton onClick={() => setDetailsRequestId(null)}>
      <CloseIcon fill="rgb(135, 139, 145)" />
    </IconButton>
  );
};

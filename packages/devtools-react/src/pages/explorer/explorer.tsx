import { useDevtoolsContext } from "devtools.context";
import { Toolbar } from "./toolbar/toolbar";
import { Content } from "./content/content";
import { Details } from "./details/details";

// TODO - show called times
// TODO - show (?) called requests from network?

export const Explorer = () => {
  const { detailsExplorerRequest } = useDevtoolsContext("DevtoolsNetworkContent");

  return (
    <>
      <Toolbar />
      <Content />
      {detailsExplorerRequest && <Details item={detailsExplorerRequest} />}
    </>
  );
};

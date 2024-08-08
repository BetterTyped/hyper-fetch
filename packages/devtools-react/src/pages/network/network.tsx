import { useMemo } from "react";

import { Content } from "./content/content";
import { Toolbar } from "./toolbar/toolbar";
import { useDevtoolsContext } from "devtools.context";
import { Details } from "./details/details";

export const Network = () => {
  const { requests, detailsRequestId } = useDevtoolsContext("DevtoolsNetworkContent");

  const activatedRequest = useMemo(() => {
    if (!detailsRequestId) return null;
    return requests.find((request) => request.requestId === detailsRequestId);
  }, [detailsRequestId, requests]);

  return (
    <>
      <Toolbar />
      <Content />
      {activatedRequest && <Details item={activatedRequest} />}
    </>
  );
};

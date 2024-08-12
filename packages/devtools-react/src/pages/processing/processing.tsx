import { useMemo } from "react";

import { Content } from "./content/content";
import { Toolbar } from "./toolbar/toolbar";
import { useDevtoolsContext } from "devtools.context";
import { Details } from "./details/details";

export const Processing = () => {
  const { queues, detailsQueueKey } = useDevtoolsContext("DevtoolsProcessingContent");

  const activatedQueue = useMemo(() => {
    if (!detailsQueueKey) return null;
    return queues.find((request) => request.queueKey === detailsQueueKey);
  }, [detailsQueueKey, queues]);

  return (
    <>
      <Toolbar />
      <Content />
      {activatedQueue && <Details item={activatedQueue} />}
    </>
  );
};

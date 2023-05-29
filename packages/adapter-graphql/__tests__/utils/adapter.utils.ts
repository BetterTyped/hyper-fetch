import { RequestInstance } from "@hyper-fetch/core";

import { graphqlAdapter } from "adapter";
import { sleep } from ".";

export const createAdapter = (props?: {
  sleepTime?: number;
  callback: (request: RequestInstance, requestId: string) => void;
}) => {
  const { sleepTime, callback } = props || {};

  return async (request: RequestInstance, requestId: string) => {
    if (sleepTime) {
      await sleep(sleepTime);
    }

    callback?.(request, requestId);
    return graphqlAdapter(request, requestId);
  };
};

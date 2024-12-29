import { sleep } from "@hyper-fetch/testing";

import { AdapterType, adapter } from "adapter";
import { RequestInstance } from "request";

export const createAdapter = (props?: {
  sleepTime?: number;
  callback: (request: RequestInstance, requestId: string) => void;
}): AdapterType => {
  const { sleepTime, callback } = props || {};

  return async (request: RequestInstance, requestId: string) => {
    if (sleepTime) {
      await sleep(sleepTime);
    }

    callback?.(request, requestId);
    return adapter(request, requestId);
  };
};

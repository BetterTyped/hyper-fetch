import { ResponseType } from "adapter";
import { RequestInstance } from "request";
import { sleep } from "./helpers.utils";

export const interceptorCallback = (props?: { sleepTime?: number; callback: () => void }) => {
  const { sleepTime, callback } = props || {};

  return async (response?: ResponseType<null, null>): Promise<ResponseType<null, null>> => {
    if (sleepTime) {
      await sleep(sleepTime);
    }

    callback?.();
    return response || [null, null, 200];
  };
};

export const middlewareCallback = (props?: { sleepTime?: number; callback: () => void }) => {
  const { sleepTime, callback } = props || {};

  return async (request: RequestInstance): Promise<RequestInstance> => {
    if (sleepTime) {
      await sleep(sleepTime);
    }

    callback?.();
    return request;
  };
};

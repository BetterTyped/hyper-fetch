import { xhrExtra, AdapterType, ResponseType } from "adapter";
import { RequestInstance } from "request";
import { sleep } from "./helpers.utils";

export const interceptorCallback = (props?: { sleepTime?: number; callback: () => void }) => {
  const { sleepTime, callback } = props || {};

  return async (response?: ResponseType<null, null, AdapterType>): Promise<ResponseType<null, null, AdapterType>> => {
    if (sleepTime) {
      await sleep(sleepTime);
    }

    callback?.();
    return response || { data: null, error: null, success: true, status: 200, extra: xhrExtra };
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

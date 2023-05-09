import { AdapterType, ResponseReturnType } from "adapter";
import { xhrExtra } from "client";
import { RequestInstance } from "request";
import { sleep } from "./helpers.utils";

export const interceptorCallback = (props?: { sleepTime?: number; callback: () => void }) => {
  const { sleepTime, callback } = props || {};

  return async (
    response?: ResponseReturnType<null, null, AdapterType>,
  ): Promise<ResponseReturnType<null, null, AdapterType>> => {
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

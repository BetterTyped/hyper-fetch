import { BaseAdapterType, ResponseReturnType } from "adapter";
import { RequestInstance } from "request";
import { sleep } from "./helpers.utils";

export const interceptorCallback = (props?: { sleepTime?: number; callback: () => void }) => {
  const { sleepTime, callback } = props || {};

  return async (
    response?: ResponseReturnType<null, null, BaseAdapterType>,
  ): Promise<ResponseReturnType<null, null, BaseAdapterType>> => {
    if (sleepTime) {
      await sleep(sleepTime);
    }

    callback?.();
    return response || { data: null, error: null, isSuccess: true, status: 200, additionalData: {} };
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

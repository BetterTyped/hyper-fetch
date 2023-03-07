import { AdapterAdditionalDataType, ResponseType } from "adapter";
import { RequestInstance } from "request";
import { sleep } from "./helpers.utils";

export const interceptorCallback = (props?: { sleepTime?: number; callback: () => void }) => {
  const { sleepTime, callback } = props || {};

  return async (
    response?: ResponseType<null, null, AdapterAdditionalDataType>,
  ): Promise<ResponseType<null, null, AdapterAdditionalDataType>> => {
    if (sleepTime) {
      await sleep(sleepTime);
    }

    callback?.();
    return response || { data: null, error: null, additionalData: { status: 200 } };
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

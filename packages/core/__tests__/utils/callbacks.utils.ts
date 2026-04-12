import { sleep } from "@hyper-fetch/testing";

import type { ResponseType } from "adapter";
import type { RequestInstance } from "request";
import type { ClientInstance, ResponseInterceptorType } from "client";
import type { HttpAdapterType } from "http-adapter";
import { xhrExtra } from "http-adapter";

export const interceptorCallback = (props?: {
  sleepTime?: number;
  callback: () => void;
}): ResponseInterceptorType<ClientInstance> => {
  const { sleepTime, callback } = props || {};

  return async (
    response?: ResponseType<null, null, HttpAdapterType>,
  ): Promise<ResponseType<null, null, HttpAdapterType>> => {
    if (sleepTime) {
      await sleep(sleepTime);
    }

    callback?.();
    return (
      response || {
        data: null,
        error: null,
        success: true,
        status: 200,
        extra: xhrExtra,
        requestTimestamp: 0,
        responseTimestamp: 0,
      }
    );
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

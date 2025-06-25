import { RequestOptionsType, HttpAdapterOptionsType } from "@hyper-fetch/core";

import { client } from "./client.utils";

export const createRequest = <ResponseType = any, PayloadType = any>(
  options?: Partial<RequestOptionsType<string, HttpAdapterOptionsType>>,
) => {
  return client.createRequest<{ response: ResponseType; payload: PayloadType; error: Error }>()({
    endpoint: "/shared-endpoint",
    ...options,
  });
};

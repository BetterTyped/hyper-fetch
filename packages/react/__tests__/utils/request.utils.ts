import { RequestOptionsType, HttpAdapterOptionsType } from "@hyper-fetch/core";

import { client } from "./client.utils";

export const createRequest = <ResponseType = any, PayloadType = any, Endpoint extends string = "/shared-endpoint">(
  options?: Partial<RequestOptionsType<Endpoint, HttpAdapterOptionsType>>,
) => {
  return client.createRequest<{ response: ResponseType; payload: PayloadType; error: Error; queryParams: any }>()({
    endpoint: "/shared-endpoint" as Endpoint,
    ...options,
  } as RequestOptionsType<Endpoint, HttpAdapterOptionsType>);
};

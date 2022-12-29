import { RequestOptionsType, AdapterOptionsType } from "@hyper-fetch/core";

import { client } from "./client.utils";

export const createRequest = <ResponseType = any, PayloadType = any>(
  options?: Partial<RequestOptionsType<string, AdapterOptionsType>>,
) => {
  return client.createRequest<ResponseType, PayloadType, Error>()({ endpoint: "/shared-endpoint", ...options });
};

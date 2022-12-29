import { ClientInstance } from "client";
import { RequestOptionsType } from "request";
import { AdapterOptionsType } from "adapter";

export const createRequest = <T extends ClientInstance, ResponseType = any, PayloadType = any>(
  client: T,
  options?: Partial<RequestOptionsType<string, AdapterOptionsType>>,
) => {
  return client.createRequest<ResponseType, PayloadType>()({ endpoint: "/shared-endpoint", ...options });
};

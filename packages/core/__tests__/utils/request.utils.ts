import { Client, ClientInstance } from "client";
import { RequestOptionsType } from "request";
import { AdapterOptionsType, BaseAdapterType } from "adapter";

export const createRequest = <T extends ClientInstance, ResponseType = any, PayloadType = any>(
  client: Client<Error, BaseAdapterType>,
  options?: Partial<RequestOptionsType<string, AdapterOptionsType>>,
) => {
  return client.createRequest<ResponseType, PayloadType>()({ endpoint: "/shared-endpoint", ...options });
};

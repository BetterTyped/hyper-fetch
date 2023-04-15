import { Client, ClientInstance, ClientOptionsType } from "client";

export const createClient = (config?: Partial<ClientOptionsType<ClientInstance>>) => {
  return new Client({ url: "shared-base-url", ...config });
};

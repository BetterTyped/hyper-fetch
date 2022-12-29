import { Client, ClientOptionsType } from "client";

export const createClient = (config?: Partial<ClientOptionsType>) => {
  return new Client({ url: "shared-base-url", ...config });
};

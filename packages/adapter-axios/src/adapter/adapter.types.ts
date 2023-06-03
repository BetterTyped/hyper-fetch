import { AdapterType } from "@hyper-fetch/core";
import { AxiosHeaders, AxiosRequestConfig, Method, Method as AxiosMethods, RawAxiosRequestHeaders } from "axios";

export type AxiosAdapterType = AdapterType<
  Omit<AxiosRequestConfig, "url" | "baseURL" | "method">,
  AxiosMethods,
  number,
  AxiosExtra
>;

type MethodsHeaders = Partial<
  {
    [Key in Method as Lowercase<Key>]: AxiosHeaders;
  } & { common: AxiosHeaders }
>;

export type AxiosExtra = {
  headers: (RawAxiosRequestHeaders & MethodsHeaders) | AxiosHeaders;
};

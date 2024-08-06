import { AdapterType } from "@hyper-fetch/core";
import { AxiosHeaderValue, AxiosRequestConfig, Method, Method as AxiosMethods, RawAxiosRequestHeaders } from "axios";

export type RawAxiosHeaders = {
  [key: string]: AxiosHeaderValue;
};

export type AxiosAdapterType = AdapterType<
  Omit<AxiosRequestConfig, "url" | "baseURL" | "method" | "onUploadProgress" | "onDownloadProgress" | "data">,
  AxiosMethods,
  number,
  AxiosExtra
>;

type MethodsHeaders = Partial<
  {
    [Key in Method as Lowercase<Key>]: RawAxiosHeaders;
  } & { common: RawAxiosHeaders }
>;

export type AxiosExtra = {
  headers: (RawAxiosRequestHeaders & MethodsHeaders) | RawAxiosHeaders;
};

import { AxiosHeaderValue, Method, RawAxiosRequestHeaders } from "axios";

export type RawAxiosHeaders = {
  [key: string]: AxiosHeaderValue;
};

type MethodsHeaders = Partial<
  {
    [Key in Method as Lowercase<Key>]: RawAxiosHeaders;
  } & { common: RawAxiosHeaders }
>;

export type AxiosExtra = {
  headers: (RawAxiosRequestHeaders & MethodsHeaders) | RawAxiosHeaders;
};

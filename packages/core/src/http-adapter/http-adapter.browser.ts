import { stringifyQueryParams } from "./http-adapter.utils";
import { xhrExtra } from "./http-adapter.constants";
import { Adapter } from "../adapter/adapter";
import { HttpMethods } from "constants/http.constants";
import { HttpMethodsType, HttpStatusType } from "types";
import { HttpAdapterOptionsType, HttpAdapterExtraType } from "./http-adapter.types";
import { QueryParamsType } from "adapter";
import { httpAdapterBrowserFetcher } from "./http-adapter.browser.fetcher";

export const httpAdapter = new Adapter<
  HttpAdapterOptionsType,
  HttpMethodsType,
  HttpStatusType,
  HttpAdapterExtraType,
  QueryParamsType | string | null,
  string
>({
  name: "browser",
  defaultMethod: HttpMethods.GET,
  defaultExtra: xhrExtra,
  systemErrorStatus: 0 as number,
  systemErrorExtra: xhrExtra,
})
  .setQueryParamsMapper(stringifyQueryParams)
  .setFetcher(httpAdapterBrowserFetcher);

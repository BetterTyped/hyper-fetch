import { ClientResponseType } from "client/fetch.client.types";
import { HttpMethodsEnum } from "constants/http.constants";
import { NegativeTypes } from "types";

export type ProgressEvent = { total: number; loaded: number };
export type ProgressResponse = { progress: number; timeLeft: number; sizeLeft: number };

export type OnProgressCallback = ({ progress, timeLeft, sizeLeft }: ProgressResponse) => void;
export type ClientProgressCallback = (progressEvent: ProgressEvent) => void;

export type FetchMiddlewareOptions<GenericEndpoint extends string, ClientOptions> = {
  endpoint: GenericEndpoint;
  headers: Headers;
  method?: HttpMethodsEnum;
  options?: ClientOptions;
};

export type ParamType = string | number;
export type ParamsType = Record<string, ParamType>;

export type ApiQueryParamsType<HasQuery extends true | false = false> = HasQuery extends true
  ? { queryParams?: undefined }
  : {
      queryParams?: string;
    };

export type ExtractRouteParams<T extends string> = string extends T
  ? null
  : T extends `${infer Start}:${infer Param}/${infer Rest}`
  ? { [k in Param | keyof ExtractRouteParams<Rest>]: ParamType }
  : T extends `${infer Start}:${infer Param}`
  ? { [k in Param]: ParamType }
  : null;

export type ApiParamsType<
  Params extends string,
  HasParams extends true | false = false,
> = ExtractRouteParams<Params> extends NegativeTypes
  ? { params?: undefined }
  : true extends HasParams
  ? { params?: undefined }
  : { params: ExtractRouteParams<Params> };

export type ApiRequestDataType<
  RequestData,
  HasData extends true | false = false,
> = RequestData extends NegativeTypes
  ? { data?: undefined }
  : HasData extends true
  ? { data?: undefined }
  : { data: RequestData };

export type FetchType<
  RequestData,
  Params extends string,
  HasData extends true | false,
  HasParams extends true | false,
  HasQuery extends true | false,
> = ApiQueryParamsType<HasQuery> &
  ApiParamsType<Params, HasParams> &
  ApiRequestDataType<RequestData, HasData>;

export type FetchMethodType<
  ResponseType,
  PayloadType,
  ErrorType,
  EndpointType extends string,
  HasData extends true | false = false,
  HasParams extends true | false = false,
  HasQuery extends true | false = false,
> = FetchType<PayloadType, EndpointType, HasData, HasParams, HasQuery>["data"] extends NegativeTypes
  ? FetchType<
      PayloadType,
      EndpointType,
      HasData,
      HasParams,
      HasQuery
    >["params"] extends NegativeTypes
    ? (
        options?: FetchType<PayloadType, EndpointType, HasData, HasParams, HasQuery>,
      ) => Promise<ClientResponseType<ResponseType, ErrorType>>
    : (
        options: FetchType<PayloadType, EndpointType, HasData, HasParams, HasQuery>,
      ) => Promise<ClientResponseType<ResponseType, ErrorType>>
  : (
      options: FetchType<PayloadType, EndpointType, HasData, HasParams, HasQuery>,
    ) => Promise<ClientResponseType<ResponseType, ErrorType>>;

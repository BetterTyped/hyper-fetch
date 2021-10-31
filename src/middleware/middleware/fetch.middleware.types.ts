import { ClientResponseType } from "client/fetch.client.types";
import { HttpMethodsType, NegativeTypes } from "types";
import { FetchMiddleware } from "./fetch.middleware";

export type ProgressEvent = { total: number; loaded: number };
export type ProgressResponse = { progress: number; timeLeft: number; sizeLeft: number };

export type OnProgressCallback = ({ progress, timeLeft, sizeLeft }: ProgressResponse) => void;
export type ClientProgressCallback = (progressEvent: ProgressEvent) => void;

export type FetchMiddlewareOptions<GenericEndpoint extends string, ClientOptions> = {
  endpoint: GenericEndpoint;
  headers?: HeadersInit;
  method?: HttpMethodsType;
  options?: ClientOptions;
};

export type DefaultOptionsType<PayloadType, GenericEndpoint extends string> = {
  endpoint?: GenericEndpoint | NegativeTypes;
  params?: ExtractRouteParams<GenericEndpoint> | NegativeTypes;
  queryParams?: string | NegativeTypes;
  data?: PayloadType | NegativeTypes;
};

export type ParamType = string | number;
export type ParamsType = Record<string, ParamType>;

export type ExtractRouteParams<T extends string> = string extends T
  ? NegativeTypes
  : T extends `${infer Start}:${infer Param}/${infer Rest}`
  ? { [k in Param | keyof ExtractRouteParams<Rest>]: ParamType }
  : T extends `${infer Start}:${infer Param}`
  ? { [k in Param]: ParamType }
  : NegativeTypes;

export type FetchQueryParamsType<HasQuery extends true | false = false> = HasQuery extends true
  ? { queryParams?: NegativeTypes }
  : {
      queryParams?: string;
    };

export type FetchParamsType<
  EndpointType extends string,
  HasParams extends true | false = false,
> = ExtractRouteParams<EndpointType> extends NegativeTypes
  ? { params?: NegativeTypes }
  : true extends HasParams
  ? { params?: NegativeTypes }
  : { params: ExtractRouteParams<EndpointType> };

export type FetchRequestDataType<
  PayloadType,
  HasData extends true | false = false,
> = PayloadType extends NegativeTypes
  ? { data?: NegativeTypes }
  : HasData extends true
  ? { data?: NegativeTypes }
  : { data: PayloadType };

export type FetchType<
  PayloadType,
  EndpointType extends string,
  HasData extends true | false,
  HasParams extends true | false,
  HasQuery extends true | false,
> = FetchQueryParamsType<HasQuery> &
  FetchParamsType<EndpointType, HasParams> &
  FetchRequestDataType<PayloadType, HasData>;

export type FetchMethodType<
  ResponseType,
  PayloadType,
  ErrorType,
  EndpointType extends string,
  HasData extends true | false,
  HasParams extends true | false,
  HasQuery extends true | false,
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

export type FetchMiddlewareInstance = FetchMiddleware<any, any, any, any, any, true, true, true>;

import { ClientResponseType, ClientResponseSuccessType, ClientResponseErrorType } from "client/fetch.client.types";
import { HttpMethodsType, NegativeTypes, ExtractResponse, ExtractError } from "types";
import { FetchMiddleware } from "./fetch.middleware";

// Progress
export type ClientProgressEvent = { total: number; loaded: number };
export type ClientProgressResponse = { progress: number; timeLeft: number; sizeLeft: number };

// Callbacks
export type ClientStartCallback = (e: ProgressEvent<XMLHttpRequest>) => void;
export type ClientProgressCallback = ({ progress, timeLeft, sizeLeft }: ClientProgressResponse) => void;
export type ClientErrorCallback = <T extends FetchMiddlewareInstance>(
  response: ClientResponseErrorType<ExtractError<T>>,
  middleware: T,
) => void;
export type ClientSuccessCallback = <T extends FetchMiddlewareInstance>(
  response: ClientResponseSuccessType<ExtractResponse<T>>,
  middleware: T,
) => void;
export type ClientFinishedCallback = <T extends FetchMiddlewareInstance>(
  response: ClientResponseType<ExtractResponse<T>, ExtractError<T>>,
  middleware: T,
) => void;
export type ClientCancelTokenCallback = <T extends FetchMiddlewareInstance>(middleware: T) => void;

// Middleware
export type FetchMiddlewareOptions<GenericEndpoint extends string, ClientOptions> = {
  endpoint: GenericEndpoint;
  headers?: HeadersInit;
  method?: HttpMethodsType;
  options?: ClientOptions;
  disableResponseInterceptors?: boolean;
  disableRequestInterceptors?: boolean;
};

export type DefaultOptionsType<ResponseType, PayloadType, ErrorType, GenericEndpoint extends string> = {
  endpoint?: GenericEndpoint | NegativeTypes;
  params?: ExtractRouteParams<GenericEndpoint> | NegativeTypes;
  queryParams?: string | NegativeTypes;
  data?: PayloadType | NegativeTypes;
  mockedData?: ((data: PayloadType) => ClientResponseType<ResponseType, ErrorType>) | undefined;
  cancelRequest?: VoidFunction;
};

export type ParamType = string | number;
export type ParamsType = Record<string, ParamType>;

export type ExtractRouteParams<T extends string> = string extends T
  ? NegativeTypes
  : T extends `${string}:${infer Param}/${infer Rest}`
  ? { [k in Param | keyof ExtractRouteParams<Rest>]: ParamType }
  : T extends `${string}:${infer Param}`
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

export type FetchRequestDataType<PayloadType, HasData extends true | false = false> = PayloadType extends NegativeTypes
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
> = FetchType<PayloadType, EndpointType, HasData, HasParams, HasQuery>["data"] extends any
  ? (
      options?: FetchType<PayloadType, EndpointType, HasData, HasParams, HasQuery>,
    ) => Promise<ClientResponseType<ResponseType, ErrorType>>
  : FetchType<PayloadType, EndpointType, HasData, HasParams, HasQuery>["data"] extends NegativeTypes
  ? FetchType<PayloadType, EndpointType, HasData, HasParams, HasQuery>["params"] extends NegativeTypes
    ? (
        options?: FetchType<PayloadType, EndpointType, HasData, HasParams, HasQuery>,
      ) => Promise<ClientResponseType<ResponseType, ErrorType>>
    : (
        options: FetchType<PayloadType, EndpointType, HasData, HasParams, HasQuery>,
      ) => Promise<ClientResponseType<ResponseType, ErrorType>>
  : (
      options: FetchType<PayloadType, EndpointType, HasData, HasParams, HasQuery>,
    ) => Promise<ClientResponseType<ResponseType, ErrorType>>;

export type FetchMiddlewareInstance = FetchMiddleware<any, any, any, any, any, any, any, any>;

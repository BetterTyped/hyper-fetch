import { HttpMethodsEnum } from "constants/http.constants";
import { HttpMethodsType, NegativeTypes } from "types";
import { ClientResponseType } from "client";
import { FetchBuilder } from "../builder/fetch.builder";
import {
  ClientProgressCallback,
  DefaultOptionsType,
  ExtractRouteParams,
  FetchMethodType,
  FetchMiddlewareOptions,
  FetchType,
  ParamsType,
  ClientErrorCallback,
  ClientFinishedCallback,
  ClientSuccessCallback,
  ClientStartCallback,
} from "./fetch.middleware.types";

export class FetchMiddleware<
  ResponseType,
  PayloadType,
  ErrorType,
  EndpointType extends string,
  ClientOptions,
  HasData extends true | false = false,
  HasParams extends true | false = false,
  HasQuery extends true | false = false,
> {
  mockCallback: ((data: PayloadType) => ClientResponseType<ResponseType, ErrorType>) | undefined;
  endpoint: EndpointType;
  headers?: HeadersInit;
  method: HttpMethodsType;
  params: ExtractRouteParams<EndpointType> | NegativeTypes;
  data: PayloadType | NegativeTypes;
  queryParams: string | NegativeTypes;
  options: ClientOptions;

  abortController = new AbortController();

  constructor(
    readonly builderConfig: ReturnType<FetchBuilder<ErrorType, ClientOptions>["getBuilderConfig"]>,
    readonly apiConfig: FetchMiddlewareOptions<EndpointType, ClientOptions>,
    readonly defaultOptions?: DefaultOptionsType<ResponseType, PayloadType, ErrorType, EndpointType>,
  ) {
    this.endpoint = defaultOptions?.endpoint || apiConfig?.endpoint;
    this.headers = apiConfig?.headers;
    this.method = apiConfig?.method || HttpMethodsEnum.get;
    this.params = defaultOptions?.params;
    this.data = defaultOptions?.data;
    this.queryParams = defaultOptions?.queryParams;
    this.mockCallback = defaultOptions?.mockCallback;
  }

  readonly requestStartCallbacks: ClientStartCallback[] = [];
  readonly responseStartCallbacks: ClientStartCallback[] = [];
  readonly requestProgressCallbacks: ClientProgressCallback[] = [];
  readonly responseProgressCallbacks: ClientProgressCallback[] = [];
  readonly onFinishedCallbacks: ClientFinishedCallback[] = [];
  readonly onErrorCallbacks: ClientErrorCallback[] = [];
  readonly onSuccessCallbacks: ClientSuccessCallback[] = [];

  public onRequestStart = (callback: ClientStartCallback) => {
    const cloned = this.clone();

    cloned.requestStartCallbacks.push(callback);

    return cloned;
  };

  public onResponseStart = (callback: ClientStartCallback) => {
    const cloned = this.clone();

    cloned.responseStartCallbacks.push(callback);

    return cloned;
  };

  public onRequestProgress = (callback: ClientProgressCallback) => {
    const cloned = this.clone();

    cloned.requestProgressCallbacks.push(callback);

    return cloned;
  };

  public onResponseProgress = (callback: ClientProgressCallback) => {
    const cloned = this.clone();

    cloned.responseProgressCallbacks.push(callback);

    return cloned;
  };

  public onError = (callback: ClientErrorCallback) => {
    const cloned = this.clone();

    cloned.onErrorCallbacks.push(callback);

    return cloned;
  };

  public onSuccess = (callback: ClientSuccessCallback) => {
    const cloned = this.clone();

    cloned.onSuccessCallbacks.push(callback);

    return cloned;
  };

  public onFinished = (callback: ClientFinishedCallback) => {
    const cloned = this.clone();

    cloned.onFinishedCallbacks.push(callback);

    return cloned;
  };

  public setData = (
    data: PayloadType,
  ): FetchMiddleware<ResponseType, PayloadType, ErrorType, EndpointType, ClientOptions, true, HasParams, HasQuery> => {
    return this.clone({ data }) as FetchMiddleware<
      ResponseType,
      PayloadType,
      ErrorType,
      EndpointType,
      ClientOptions,
      true,
      HasParams,
      HasQuery
    >;
  };

  public setParams = (
    params: ExtractRouteParams<EndpointType>,
  ): FetchMiddleware<ResponseType, PayloadType, ErrorType, EndpointType, ClientOptions, HasData, true, HasQuery> => {
    return this.clone({ params }) as FetchMiddleware<
      ResponseType,
      PayloadType,
      ErrorType,
      EndpointType,
      ClientOptions,
      HasData,
      true,
      HasQuery
    >;
  };

  public setQueryParams = (
    queryParams: string,
  ): FetchMiddleware<ResponseType, PayloadType, ErrorType, EndpointType, ClientOptions, HasData, HasParams, true> => {
    return this.clone({ queryParams }) as FetchMiddleware<
      ResponseType,
      PayloadType,
      ErrorType,
      EndpointType,
      ClientOptions,
      HasData,
      HasParams,
      true
    >;
  };

  public mock = (mockCallback: (data: PayloadType) => ClientResponseType<ResponseType, ErrorType>) => {
    return this.clone({ mockCallback });
  };

  private paramsMapper = (params: ParamsType | null | undefined): string => {
    let endpoint = this.apiConfig.endpoint as string;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        endpoint = endpoint.replace(new RegExp(`:${key}`, "g"), String(value));
      });
    }
    return endpoint;
  };

  public clone(
    options?: DefaultOptionsType<ResponseType, PayloadType, ErrorType, EndpointType>,
  ): FetchMiddleware<ResponseType, PayloadType, ErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery> {
    const currentOptions: DefaultOptionsType<ResponseType, PayloadType, ErrorType, EndpointType> = {
      endpoint: this.paramsMapper(options?.params || this.params) as EndpointType,
      params: options?.params || this.params,
      queryParams: options?.queryParams || this.queryParams,
      data: options?.data || this.data,
      mockCallback: options?.mockCallback || this.mockCallback,
      abortController: this.abortController,
    };

    const cloned = new FetchMiddleware<
      ResponseType,
      PayloadType,
      ErrorType,
      EndpointType,
      ClientOptions,
      HasData,
      HasParams,
      HasQuery
    >(this.builderConfig, this.apiConfig, currentOptions);

    return Object.assign(cloned, {
      requestStartCallbacks: this.requestStartCallbacks,
      responseStartCallbacks: this.responseStartCallbacks,
      requestProgressCallbacks: this.requestProgressCallbacks,
      responseProgressCallbacks: this.responseProgressCallbacks,
      onFinishedCallbacks: this.onFinishedCallbacks,
      onErrorCallbacks: this.onErrorCallbacks,
      onSuccessCallbacks: this.onSuccessCallbacks,
    });
  }

  public send: FetchMethodType<ResponseType, PayloadType, ErrorType, EndpointType, HasData, HasParams, HasQuery> =
    async (options?: FetchType<PayloadType, EndpointType, HasData, HasParams, HasQuery>) => {
      if (this.mockCallback) return Promise.resolve(this.mockCallback(this.data as PayloadType));

      const middleware = this.clone(options);

      const { client } = this.builderConfig;

      return client(middleware);
    };
}

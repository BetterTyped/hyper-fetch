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
  ClientCancelTokenCallback,
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
  mockedData: ((data: PayloadType) => ClientResponseType<ResponseType, ErrorType>) | undefined;
  endpoint: EndpointType;
  headers?: HeadersInit;
  method: HttpMethodsType;
  params: ExtractRouteParams<EndpointType> | NegativeTypes;
  data: PayloadType | NegativeTypes;
  queryParams: string | NegativeTypes;
  options: ClientOptions;
  cancelRequest: VoidFunction | undefined;

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
    this.mockedData = defaultOptions?.mockedData;
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

  public setCancelToken = (callback: ClientCancelTokenCallback) => {
    const cloned = this.clone();

    cloned.cancelRequest = () => callback(cloned);

    return cloned as FetchMiddleware<
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

  public setData = (data: PayloadType) => {
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

  public setParams = (params: ExtractRouteParams<EndpointType>) => {
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

  public setQueryParams = (queryParams: string) => {
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

  public mock = (mockedData: (data: PayloadType) => ClientResponseType<ResponseType, ErrorType>) => {
    return this.clone({ mockedData }) as FetchMiddleware<
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

  private paramsMapper = (params: ParamsType | null | undefined): string => {
    let endpoint = this.apiConfig.endpoint as string;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        endpoint = endpoint.replaceAll(new RegExp(`:${key}`, "g"), String(value));
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
      mockedData: options?.mockedData || this.mockedData,
      cancelRequest: this.cancelRequest,
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

    return cloned;
  }

  public send: FetchMethodType<ResponseType, PayloadType, ErrorType, EndpointType, HasData, HasParams, HasQuery> =
    async (options?: FetchType<PayloadType, EndpointType, HasData, HasParams, HasQuery>) => {
      if (this.mockedData) return Promise.resolve(this.mockedData(this.data as PayloadType));

      const middleware = this.clone(options);

      const { client } = this.builderConfig;

      return client(middleware);
    };
}

// TYPESCRIPT TEST CASES

// const fetchMiddleware = new FetchBuilder({
//   baseUrl: "http://localhost:3000",
// }).build();

// const getUsers = fetchMiddleware<{ id: string }[]>()({
//   method: "GET",
//   endpoint: "/users",
// });

// const getUser = fetchMiddleware<{ id: string }>()({
//   method: "GET",
//   endpoint: "/users/:id",
// });

// const postUser = fetchMiddleware<{ id: string }, { name: string }>()({
//   method: "POST",
//   endpoint: "/users",
// });

// const patchUser = fetchMiddleware<{ id: string }, { name: string }>()({
//   method: "PATCH",
//   endpoint: "/users/:id",
// });

// // OK
// getUsers.send({ queryParams: "" });
// getUsers.setQueryParams("").send();
// // Fail
// getUsers.send({ data: "" });
// getUsers.send({ params: "" });
// getUsers.setQueryParams("").send({ queryParams: "" });

// // OK
// getUser.send({ params: { id: "" }, queryParams: "" });
// getUser.setParams({ id: "" }).send({ queryParams: "" });
// // Fail
// getUser.send({ queryParams: "" });
// getUser.send();
// getUser.setParams({ id: "" }).send({ params: { id: "" } });

// // OK
// postUser.send({ data: { name: "" } });
// postUser.setData({ name: "" }).send();
// // Fail
// postUser.send({ queryParams: "" });
// postUser.send({ data: null });
// postUser.send();
// postUser.setData({ name: "" }).send({ data: { name: "" } });

// // OK
// patchUser.send({ params: { id: "" }, data: { name: "" } });
// patchUser.setParams({ id: "" }).setData({ name: "" }).send();
// // Fail
// patchUser.send({ queryParams: "" });
// patchUser.send({ data: null });
// patchUser.send();
// patchUser
//   .setParams({ id: "" })
//   .setData({ name: "" })
//   .send({ data: { name: "" } });
// patchUser
//   .setParams({ id: "" })
//   .setData({ name: "" })
//   .send({ params: { id: "" } });

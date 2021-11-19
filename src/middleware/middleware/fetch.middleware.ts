import { HttpMethodsEnum } from "constants/http.constants";
import { HttpMethodsType, NegativeTypes } from "types";
import { ClientResponseType } from "client";
import { FetchBuilder } from "../builder/fetch.builder";
import { getProgressData } from "./fetch.middleware.utils";
import {
  ClientProgressCallback,
  DefaultOptionsType,
  ExtractRouteParams,
  FetchMethodType,
  FetchMiddlewareOptions,
  FetchType,
  OnProgressCallback,
  ParamsType,
  ProgressEvent,
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

  private timestamp: Date = new Date();

  readonly uploadProgressCallbacks: ClientProgressCallback[] = [];
  readonly downloadProgressCallbacks: ClientProgressCallback[] = [];

  public onUploadProgress = (callback: OnProgressCallback) => {
    const cloned = this.clone();

    const startTime = this.timestamp;
    const progressCallback = (event: ProgressEvent) => callback(getProgressData(startTime, event));
    cloned.uploadProgressCallbacks.push(progressCallback);

    return cloned;
  };

  public onDownloadProgress = (callback: OnProgressCallback) => {
    const cloned = this.clone();

    const startTime = this.timestamp;
    const progressCallback = (event: ProgressEvent) => callback(getProgressData(startTime, event));
    cloned.downloadProgressCallbacks.push(progressCallback);

    return cloned;
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

  public fetch: FetchMethodType<ResponseType, PayloadType, ErrorType, EndpointType, HasData, HasParams, HasQuery> =
    async (options?: FetchType<PayloadType, EndpointType, HasData, HasParams, HasQuery>) => {
      if (this.mockedData) return Promise.resolve(this.mockedData(this.data as PayloadType));

      const middleware = this.clone(options);
      const mappedRequest = (await middleware.builderConfig?.onRequest?.(middleware)) || middleware;

      const { client } = this.builderConfig;
      this.timestamp = new Date();

      const response = await client(mappedRequest);
      const mappedResponse = (await middleware.builderConfig?.onResponse?.(response, mappedRequest)) || response;

      return mappedResponse;
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
// getUsers.fetch({ queryParams: "" });
// getUsers.setQueryParams("").fetch();
// // Fail
// getUsers.fetch({ data: "" });
// getUsers.fetch({ params: "" });
// getUsers.setQueryParams("").fetch({ queryParams: "" });

// // OK
// getUser.fetch({ params: { id: "" }, queryParams: "" });
// getUser.setParams({ id: "" }).fetch({ queryParams: "" });
// // Fail
// getUser.fetch({ queryParams: "" });
// getUser.fetch();
// getUser.setParams({ id: "" }).fetch({ params: { id: "" } });

// // OK
// postUser.fetch({ data: { name: "" } });
// postUser.setData({ name: "" }).fetch();
// // Fail
// postUser.fetch({ queryParams: "" });
// postUser.fetch({ data: null });
// postUser.fetch();
// postUser.setData({ name: "" }).fetch({ data: { name: "" } });

// // OK
// patchUser.fetch({ params: { id: "" }, data: { name: "" } });
// patchUser.setParams({ id: "" }).setData({ name: "" }).fetch();
// // Fail
// patchUser.fetch({ queryParams: "" });
// patchUser.fetch({ data: null });
// patchUser.fetch();
// patchUser
//   .setParams({ id: "" })
//   .setData({ name: "" })
//   .fetch({ data: { name: "" } });
// patchUser
//   .setParams({ id: "" })
//   .setData({ name: "" })
//   .fetch({ params: { id: "" } });

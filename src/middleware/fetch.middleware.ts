import { FetchBuilder } from "./fetch.builder";
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
import { HttpMethodsEnum } from "constants/http.constants";
import { HttpMethodsType, NegativeTypes } from "types";

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
  constructor(
    readonly builderConfig: ReturnType<FetchBuilder<ErrorType, ClientOptions>["getBuilderConfig"]>,
    readonly apiConfig: FetchMiddlewareOptions<EndpointType, ClientOptions>,
    readonly defaultOptions?: DefaultOptionsType<PayloadType, EndpointType>,
  ) {}

  readonly endpoint: EndpointType = this.defaultOptions?.endpoint || this.apiConfig.endpoint;
  readonly headers?: Headers = this.apiConfig.headers;
  readonly method: HttpMethodsType = this.apiConfig.method || HttpMethodsEnum.get;
  readonly params: ExtractRouteParams<EndpointType> | NegativeTypes = this.defaultOptions?.params;
  readonly data: PayloadType | NegativeTypes = this.defaultOptions?.data;
  readonly queryParams: string | NegativeTypes = this.defaultOptions?.queryParams;
  readonly options: ClientOptions;

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

  setData = (data: PayloadType) => {
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

  setParams = (params: ExtractRouteParams<EndpointType>) => {
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

  setQueryParams = (queryParams: string) => {
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

  private paramsMapper = (params: ParamsType | null | undefined): string => {
    let endpoint = this.apiConfig.endpoint as string;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        endpoint = endpoint.replaceAll(new RegExp(`:${key}`, "g"), String(value));
      });
    }
    return endpoint;
  };

  private clone(options?: {
    queryParams?: string | NegativeTypes;
    params?: ExtractRouteParams<EndpointType> | NegativeTypes;
    data?: PayloadType | NegativeTypes;
  }): FetchMiddleware<
    ResponseType,
    PayloadType,
    ErrorType,
    EndpointType,
    ClientOptions,
    HasData,
    HasParams,
    HasQuery
  > {
    const defaultOptions: DefaultOptionsType<PayloadType, EndpointType> = {
      endpoint: this.paramsMapper(options?.params || this.params) as EndpointType,
      params: options?.params || this.params,
      queryParams: options?.queryParams || this.queryParams,
      data: options?.data || this.data,
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
    >(this.builderConfig, this.apiConfig, defaultOptions);

    return cloned;
  }

  fetch: FetchMethodType<
    ResponseType,
    PayloadType,
    ErrorType,
    EndpointType,
    HasData,
    HasParams,
    HasQuery
  > = (options?: FetchType<PayloadType, EndpointType, HasData, HasParams, HasQuery>) => {
    const middleware = this.clone(options);
    const { client } = this.builderConfig;
    this.timestamp = new Date();
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

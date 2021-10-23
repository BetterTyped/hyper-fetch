import { FetchBuilder } from "./fetch.builder";
import { getProgressData } from "./fetch.middleware.utils";
import {
  ClientProgressCallback,
  FetchMethodType,
  FetchMiddlewareOptions,
  FetchType,
  OnProgressCallback,
  ParamsType,
  ProgressEvent,
} from "./fetch.middleware.types";
import { HttpMethodsEnum } from "constants/http.constants";
import { HttpMethodsType } from "types";

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
  ) {}

  readonly endpoint: EndpointType = this.apiConfig.endpoint;
  readonly headers?: Headers = this.apiConfig.headers;
  readonly method: HttpMethodsType = this.apiConfig.method || HttpMethodsEnum.get;
  readonly params: ParamsType;
  readonly data: PayloadType | null;
  readonly queryParams: string;
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

  public setData = (data: PayloadType) => {
    const cloned = this.clone({ data });
    return cloned as FetchMiddleware<
      ResponseType,
      PayloadType,
      ErrorType,
      EndpointType,
      true,
      HasParams,
      HasQuery
    >;
  };

  public setParams = (
    params: FetchType<PayloadType, EndpointType, HasData, HasParams, HasQuery>["params"],
  ) => {
    const cloned = this;
    if (params) {
      this.clone({ params });
    }
    return cloned as FetchMiddleware<
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
    const cloned = this.clone({ queryParams });
    return cloned as FetchMiddleware<
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

  private clone(
    { params = this.params, queryParams = this.queryParams, data = this.data } = {
      params: this.params,
      queryParams: this.queryParams,
      data: this.data,
    },
  ): FetchMiddleware<
    ResponseType,
    PayloadType,
    ErrorType,
    EndpointType,
    ClientOptions,
    HasData,
    HasParams,
    HasQuery
  > {
    const cloned = new FetchMiddleware<
      ResponseType,
      PayloadType,
      ErrorType,
      EndpointType,
      ClientOptions
    >(this.builderConfig, this.apiConfig);

    return Object.assign(cloned, {
      ...this,
      endpoint: this.paramsMapper(this.params),
      params,
      queryParams,
      data,
    });
  }

  fetch: FetchMethodType<
    ResponseType,
    PayloadType,
    ErrorType,
    EndpointType,
    HasData,
    HasParams,
    HasQuery
  > = (options) => {
    const middleware = this.clone();
    const { client } = this.builderConfig;

    this.timestamp = new Date();
    return client(middleware);
  };
}

// TYPESCRIPT TEST CASES

// const fetchMiddleware = new FetchBuilder({
//   baseUrl: "http://localhost:3000",
// }).build();

// const getUsers = fetchMiddleware<{ name: string }[]>()({
//   method: "GET",
//   endpoint: "/users",
// });

// const getUser = fetchMiddleware<{ name: string }>()({
//   method: "GET",
//   endpoint: "/users/:id",
// });

// const postUser = fetchMiddleware<{ name: string }, { name: string }>()({
//   method: "POST",
//   endpoint: "/users",
// });

// const patchUser = fetchMiddleware<{ name: string }, { name: string }>()({
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

// const { payload, error } = useFetch(getUsers);

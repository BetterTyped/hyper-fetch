import {
  FetchCommandDump,
  getAbortKey,
  addAbortController,
  abortCommand,
  DefaultOptionsType,
  ExtractRouteParams,
  FetchMethodType,
  FetchCommandOptions,
  FetchType,
  ParamsType,
} from "command";
import { HttpMethodsEnum } from "constants/http.constants";
import { HttpMethodsType, NegativeTypes } from "types";
import { ClientQueryParamsType, ClientResponseType } from "client";
import { FetchBuilder } from "builder";
import { getCacheRequestKey } from "cache";

export class FetchCommand<
  ResponseType,
  PayloadType,
  QueryParamsType extends ClientQueryParamsType,
  ErrorType,
  EndpointType extends string,
  ClientOptions,
  HasData extends true | false = false,
  HasParams extends true | false = false,
  HasQuery extends true | false = false,
> {
  protected mockCallback: ((data: PayloadType) => ClientResponseType<ResponseType, ErrorType>) | undefined;

  endpoint: EndpointType;
  headers?: HeadersInit;
  method: HttpMethodsType;
  params: ExtractRouteParams<EndpointType> | NegativeTypes;
  data: PayloadType | NegativeTypes;
  queryParams: QueryParamsType | string | NegativeTypes;
  options: ClientOptions | undefined;
  cancelable?: boolean;
  retry?: boolean | number;
  retryTime?: number;
  cacheTime?: number;
  queued?: boolean;
  deepEqual?: boolean;

  abortKey: string;
  cacheKey: string;
  queueKey: string;

  constructor(
    readonly builder: FetchBuilder<ErrorType, ClientOptions>,
    readonly commandOptions: FetchCommandOptions<EndpointType, ClientOptions>,
    readonly defaultOptions?: DefaultOptionsType<
      ResponseType,
      PayloadType,
      QueryParamsType,
      ErrorType,
      EndpointType,
      ClientOptions
    >,
  ) {
    this.endpoint = defaultOptions?.endpoint || commandOptions.endpoint;
    this.headers = defaultOptions?.headers || commandOptions.headers;
    this.method = commandOptions.method || HttpMethodsEnum.get;
    this.params = defaultOptions?.params;
    this.data = defaultOptions?.data;
    this.queryParams = defaultOptions?.queryParams;
    this.mockCallback = defaultOptions?.mockCallback;

    this.cancelable = commandOptions.cancelable;
    this.retry = commandOptions.retry;
    this.retryTime = commandOptions.retryTime;
    this.cacheTime = commandOptions.cacheTime;
    this.queued = commandOptions.queued;
    this.deepEqual = commandOptions.deepEqual;

    this.abortKey = commandOptions.abortKey || getAbortKey(this.method, this.builder.baseUrl, this.endpoint);
    this.cacheKey = commandOptions.cacheKey || getCacheRequestKey(this);
    this.queueKey = commandOptions.queueKey || getCacheRequestKey(this);

    addAbortController(this.builder, this.abortKey);
  }

  public setData = (data: PayloadType) => {
    return this.clone<true>({ data });
  };

  public setParams = (params: ExtractRouteParams<EndpointType>) => {
    return this.clone<HasData, true, HasQuery>({ params });
  };

  public setQueryParams = (queryParams: QueryParamsType | string) => {
    return this.clone<HasData, HasParams, true>({ queryParams });
  };

  public setHeaders = (headers: HeadersInit) => {
    return this.clone({ headers });
  };

  public setCancelable = (cancelable: boolean) => {
    return this.clone({ cancelable });
  };

  public setQueued = (queued: boolean) => {
    return this.clone({ queued });
  };

  public setAbortKey = (abortKey: string) => {
    return this.clone({ abortKey });
  };

  public setCacheKey = (cacheKey: string) => {
    return this.clone({ cacheKey });
  };

  public setQueueKey = (queueKey: string) => {
    return this.clone({ queueKey });
  };

  public mock = (mockCallback: (data: PayloadType) => ClientResponseType<ResponseType, ErrorType>) => {
    return this.clone({ mockCallback });
  };

  public abort = () => {
    abortCommand(this.builder, this.abortKey, this);

    return this.clone();
  };

  private paramsMapper = (params: ParamsType | null | undefined): string => {
    let endpoint = this.commandOptions.endpoint as string;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        endpoint = endpoint.replace(new RegExp(`:${key}`, "g"), String(value));
      });
    }
    return endpoint;
  };

  public dump(): FetchCommandDump<ClientOptions> {
    return {
      endpoint: this.endpoint,
      headers: this.headers,
      method: this.method,
      queryParams: this.queryParams,
      data: this.data,
      cancelable: this.cancelable,
      retry: this.retry,
      retryTime: this.retryTime,
      cacheTime: this.cacheTime,
      queued: this.queued,
      deepEqual: this.deepEqual,
      options: this.commandOptions.options,
      disableResponseInterceptors: this.commandOptions.disableResponseInterceptors,
      disableRequestInterceptors: this.commandOptions.disableRequestInterceptors,
      abortKey: this.abortKey,
      cacheKey: this.cacheKey,
      queueKey: this.queueKey,
    };
  }

  public clone<D extends true | false = HasData, P extends true | false = HasParams, Q extends true | false = HasQuery>(
    options?: DefaultOptionsType<ResponseType, PayloadType, QueryParamsType, ErrorType, EndpointType, ClientOptions>,
  ): FetchCommand<ResponseType, PayloadType, QueryParamsType, ErrorType, EndpointType, ClientOptions, D, P, Q> {
    const currentOptions: DefaultOptionsType<
      ResponseType,
      PayloadType,
      QueryParamsType,
      ErrorType,
      EndpointType,
      ClientOptions
    > = {
      endpoint: this.paramsMapper(options?.params || this.params) as EndpointType,
      params: options?.params || this.params,
      queryParams: options?.queryParams || this.queryParams,
      data: options?.data || this.data,
      mockCallback: options?.mockCallback || this.mockCallback,
      headers: options?.headers || this.headers,
    };

    const cloned = new FetchCommand<
      ResponseType,
      PayloadType,
      QueryParamsType,
      ErrorType,
      EndpointType,
      ClientOptions,
      D,
      P,
      Q
    >(this.builder, this.commandOptions, currentOptions);

    return cloned;
  }

  public send: FetchMethodType<
    ResponseType,
    PayloadType,
    QueryParamsType,
    ErrorType,
    EndpointType,
    HasData,
    HasParams,
    HasQuery
  > = async (setup?: FetchType<PayloadType, QueryParamsType, EndpointType, HasData, HasParams, HasQuery>) => {
    if (this.mockCallback) return Promise.resolve(this.mockCallback(this.data as PayloadType));

    const command = this.clone(
      setup as DefaultOptionsType<ResponseType, PayloadType, QueryParamsType, ErrorType, EndpointType, ClientOptions>,
    );

    const { client } = this.builder;

    return client(command);
  };
}
// Typescript test cases

// import { FetchBuilder } from "builder";

// const builder = new FetchBuilder({
//   baseUrl: "http://localhost:3000",
// });

// const getUsers = fetchCommand.create<{ id: string }[]>()({
//   method: "GET",
//   endpoint: "/users",
// });

// const getUser = fetchCommand.create<{ id: string }>()({
//   method: "GET",
//   endpoint: "/users/:id",
// });

// const postUser = fetchCommand.create<{ id: string }, { name: string }>()({
//   method: "POST",
//   endpoint: "/users",
// });

// const patchUser = fetchCommand.create<{ id: string }, { name: string }>()({
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

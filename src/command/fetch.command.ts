import { HttpMethodsEnum } from "constants/http.constants";
import { HttpMethodsType, NegativeTypes } from "types";
import { FetchCommandDump, getAbortKey, addAbortController, abortCommand } from "command";
import { ClientQueryParamsType, ClientResponseType } from "client";
import { FetchBuilderConfig } from "../builder/fetch.builder.types";
import {
  ClientProgressCallback,
  DefaultOptionsType,
  ExtractRouteParams,
  FetchMethodType,
  FetchCommandOptions,
  FetchType,
  ParamsType,
  ClientErrorCallback,
  ClientFinishedCallback,
  ClientSuccessCallback,
  ClientStartCallback,
  ClientResponseStartCallback,
} from "./fetch.command.types";

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
  mockCallback: ((data: PayloadType) => ClientResponseType<ResponseType, ErrorType>) | undefined;
  endpoint: EndpointType;
  headers?: HeadersInit;
  method: HttpMethodsType;
  params: ExtractRouteParams<EndpointType> | NegativeTypes;
  data: PayloadType | NegativeTypes;
  queryParams: QueryParamsType | string | NegativeTypes;
  options: ClientOptions | undefined;
  abortKey: string;

  constructor(
    readonly builderConfig: FetchBuilderConfig<ErrorType, ClientOptions>,
    readonly commandOptions: FetchCommandOptions<EndpointType, ClientOptions>,
    readonly defaultOptions?: DefaultOptionsType<ResponseType, PayloadType, QueryParamsType, ErrorType, EndpointType>,
  ) {
    this.endpoint = defaultOptions?.endpoint || commandOptions.endpoint;
    this.headers = defaultOptions?.headers || commandOptions.headers;
    this.method = commandOptions.method || HttpMethodsEnum.get;
    this.params = defaultOptions?.params;
    this.data = defaultOptions?.data;
    this.queryParams = defaultOptions?.queryParams;
    this.mockCallback = defaultOptions?.mockCallback;
    this.abortKey = getAbortKey(this.method, this.builderConfig.baseUrl, this.endpoint);

    addAbortController(this.abortKey);
  }

  requestStartCallback: ClientStartCallback | undefined;
  responseStartCallback: ClientResponseStartCallback | undefined;
  requestProgressCallback: ClientProgressCallback | undefined;
  responseProgressCallback: ClientProgressCallback | undefined;
  onFinishedCallback: ClientFinishedCallback | undefined;
  onErrorCallback: ClientErrorCallback | undefined;
  onSuccessCallback: ClientSuccessCallback | undefined;

  public onRequestStart = (callback: ClientStartCallback) => {
    const cloned = this.clone();

    cloned.requestStartCallback = callback;

    return cloned;
  };

  public onResponseStart = (callback: ClientStartCallback) => {
    const cloned = this.clone();

    cloned.responseStartCallback = callback;

    return cloned;
  };

  public onRequestProgress = (callback: ClientProgressCallback) => {
    const cloned = this.clone();

    cloned.requestProgressCallback = callback;

    return cloned;
  };

  public onResponseProgress = (callback: ClientProgressCallback) => {
    const cloned = this.clone();

    cloned.responseProgressCallback = callback;

    return cloned;
  };

  public onError = (callback: ClientErrorCallback) => {
    const cloned = this.clone();

    cloned.onErrorCallback = callback;

    return cloned;
  };

  public onSuccess = (callback: ClientSuccessCallback) => {
    const cloned = this.clone();

    cloned.onSuccessCallback = callback;

    return cloned;
  };

  public onFinished = (callback: ClientFinishedCallback) => {
    const cloned = this.clone();

    cloned.onFinishedCallback = callback;

    return cloned;
  };

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

  public mock = (mockCallback: (data: PayloadType) => ClientResponseType<ResponseType, ErrorType>) => {
    return this.clone({ mockCallback });
  };

  public clean = () => {
    delete this.requestStartCallback;
    delete this.responseStartCallback;
    delete this.requestProgressCallback;
    delete this.responseProgressCallback;
    delete this.onFinishedCallback;
    delete this.onErrorCallback;
    delete this.onSuccessCallback;

    return this;
  };

  public abort = () => {
    abortCommand(this.abortKey);

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
      options: this.commandOptions.options,
      disableResponseInterceptors: this.commandOptions.disableResponseInterceptors,
      disableRequestInterceptors: this.commandOptions.disableRequestInterceptors,
    };
  }

  public clone<D extends true | false = HasData, P extends true | false = HasParams, Q extends true | false = HasQuery>(
    options?: DefaultOptionsType<ResponseType, PayloadType, QueryParamsType, ErrorType, EndpointType>,
  ): FetchCommand<ResponseType, PayloadType, QueryParamsType, ErrorType, EndpointType, ClientOptions, D, P, Q> {
    const currentOptions: DefaultOptionsType<ResponseType, PayloadType, QueryParamsType, ErrorType, EndpointType> = {
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
    >(this.builderConfig, this.commandOptions, currentOptions);

    return Object.assign(cloned, {
      requestStartCallback: this.requestStartCallback,
      responseStartCallback: this.responseStartCallback,
      requestProgressCallback: this.requestProgressCallback,
      responseProgressCallback: this.responseProgressCallback,
      onFinishedCallback: this.onFinishedCallback,
      onErrorCallback: this.onErrorCallback,
      onSuccessCallback: this.onSuccessCallback,
    });
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

    const command = this.clone(setup);

    const { client } = this.builderConfig;

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

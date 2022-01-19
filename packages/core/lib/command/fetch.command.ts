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
  getCommandKey,
  FetchCommandQueueOptions,
} from "command";
import { HttpMethodsEnum } from "constants/http.constants";
import { HttpMethodsType, NegativeTypes } from "types";
import { ClientQueryParamsType, ClientResponseType } from "client";
import { FetchBuilder } from "builder";
import { LoggerMethodsType } from "managers";
import { DateInterval } from "constants/time.constants";
import { FetchAction } from "action";

export class FetchCommand<
  ResponseType,
  PayloadType,
  QueryParamsType extends ClientQueryParamsType | string,
  ErrorType, // Global Error Type
  RequestErrorType, // Additional Error for specific endpoint
  EndpointType extends string,
  ClientOptions,
  HasData extends true | false = false,
  HasParams extends true | false = false,
  HasQuery extends true | false = false,
> {
  endpoint: EndpointType;
  headers?: HeadersInit;
  auth?: boolean;
  method: HttpMethodsType;
  params: ExtractRouteParams<EndpointType> | NegativeTypes;
  data: PayloadType | NegativeTypes;
  queryParams: QueryParamsType | string | NegativeTypes;
  options?: ClientOptions | undefined;
  cancelable: boolean;
  retry: boolean | number;
  retryTime: number;
  cache: boolean;
  cacheTime: number;
  concurrent: boolean;
  deepEqual: boolean;

  abortKey: string;
  cacheKey: string;
  queueKey: string;

  actions: string[] = [];

  private logger: LoggerMethodsType;

  constructor(
    readonly builder: FetchBuilder<ErrorType, ClientOptions>,
    readonly commandOptions: FetchCommandOptions<EndpointType, ClientOptions>,
    readonly current?: DefaultOptionsType<
      ResponseType,
      PayloadType,
      QueryParamsType,
      ErrorType | RequestErrorType,
      EndpointType,
      ClientOptions
    >,
  ) {
    this.logger = this.builder.loggerManager.init("Command");

    const { baseUrl } = builder;
    const {
      endpoint,
      headers,
      auth = false,
      method = HttpMethodsEnum.get,
      options,
      cancelable = false,
      retry = false,
      retryTime = 500,
      cache = true,
      cacheTime = DateInterval.minute * 5,
      concurrent = true,
      deepEqual = true,
      abortKey,
      cacheKey,
      queueKey,
    } = commandOptions;

    this.endpoint = current?.endpoint || endpoint;
    this.headers = current?.headers || headers;
    this.auth = current?.auth || auth;
    this.method = method;
    this.params = current?.params;
    this.data = current?.data;
    this.queryParams = current?.queryParams;
    this.options = current?.options || options;
    this.cancelable = current?.cancelable || cancelable;
    this.retry = current?.retry || retry;
    this.retryTime = current?.retryTime || retryTime;
    this.cache = current?.cache || cache;
    this.cacheTime = current?.cacheTime || cacheTime;
    this.concurrent = current?.concurrent || concurrent;
    this.deepEqual = current?.deepEqual || deepEqual;

    this.abortKey = current?.abortKey || abortKey || getAbortKey(this.method, baseUrl, this.endpoint, this.cancelable);
    this.cacheKey = current?.cacheKey || cacheKey || getCommandKey(this);
    this.queueKey = current?.queueKey || queueKey || getCommandKey(this);

    this.actions = current?.actions || [];

    addAbortController(this.builder, this.abortKey);
  }

  public setHeaders = (headers: HeadersInit) => {
    return this.clone({ headers });
  };

  public setAuth = (auth: boolean) => {
    return this.clone({ auth });
  };

  public setParams = (params: ExtractRouteParams<EndpointType>) => {
    return this.clone<HasData, true, HasQuery>({ params });
  };

  public setData = (data: PayloadType) => {
    return this.clone<true>({ data });
  };

  public setQueryParams = (queryParams: QueryParamsType | string) => {
    return this.clone<HasData, HasParams, true>({ queryParams });
  };

  public setOptions = (options: ClientOptions) => {
    return this.clone<HasData, HasParams, true>({ options });
  };

  public setCancelable = (cancelable: boolean) => {
    return this.clone({ cancelable });
  };

  public setRetry = (retry: FetchCommandOptions<EndpointType, ClientOptions>["retry"]) => {
    return this.clone({ retry });
  };

  public setRetryTime = (retryTime: FetchCommandOptions<EndpointType, ClientOptions>["retryTime"]) => {
    return this.clone({ retryTime });
  };

  public setCache = (cache: FetchCommandOptions<EndpointType, ClientOptions>["cache"]) => {
    return this.clone({ cache });
  };

  public setCacheTime = (cacheTime: FetchCommandOptions<EndpointType, ClientOptions>["cacheTime"]) => {
    return this.clone({ cacheTime });
  };

  public setConcurrent = (concurrent: boolean) => {
    return this.clone({ concurrent });
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

  public addAction = (action: FetchAction<ReturnType<typeof this.clone>> | string) => {
    const actionName = typeof action === "string" ? action : action?.getName();
    const actions = [...this.actions, actionName];
    return this.clone({ actions: [...new Set(actions)] });
  };

  public removeAction = (action: FetchAction<ReturnType<typeof this.clone>> | string) => {
    const actionName = typeof action === "string" ? action : action?.getName();
    const actions = this.actions.filter((currentAction) => currentAction !== actionName);
    return this.clone({ actions });
  };

  public abort = () => {
    abortCommand(this);

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
      commandOptions: this.commandOptions,
      values: {
        endpoint: this.endpoint,
        headers: this.headers,
        auth: this.auth,
        method: this.method,
        params: this.params,
        data: this.data,
        queryParams: this.queryParams,
        options: this.options,
        cancelable: this.cancelable,
        retry: this.retry,
        retryTime: this.retryTime,
        cache: this.cache,
        cacheTime: this.cacheTime,
        concurrent: this.concurrent,
        deepEqual: this.deepEqual,

        abortKey: this.abortKey,
        cacheKey: this.cacheKey,
        queueKey: this.queueKey,
        actions: this.actions,
      },
    };
  }

  public clone<D extends true | false = HasData, P extends true | false = HasParams, Q extends true | false = HasQuery>(
    options?: DefaultOptionsType<
      ResponseType,
      PayloadType,
      QueryParamsType,
      ErrorType | RequestErrorType,
      EndpointType,
      ClientOptions
    >,
  ): FetchCommand<
    ResponseType,
    PayloadType,
    QueryParamsType,
    ErrorType,
    RequestErrorType,
    EndpointType,
    ClientOptions,
    D,
    P,
    Q
  > {
    const dump = this.dump();
    const currentOptions: DefaultOptionsType<
      ResponseType,
      PayloadType,
      QueryParamsType,
      ErrorType | RequestErrorType,
      EndpointType,
      ClientOptions
    > = {
      ...dump.values,
      ...options,
      endpoint: this.paramsMapper(options?.params || this.params) as EndpointType,
      queryParams: options?.queryParams || this.queryParams,
      data: options?.data || this.data,
    };

    const cloned = new FetchCommand<
      ResponseType,
      PayloadType,
      QueryParamsType,
      ErrorType,
      RequestErrorType,
      EndpointType,
      ClientOptions,
      D,
      P,
      Q
    >(this.builder, this.commandOptions, currentOptions);

    return cloned;
  }

  /**
   * Method to use the command WITHOUT adding it to cache and queues - just pure request
   * @param options
   * @returns
   */
  public exec: FetchMethodType<
    ResponseType,
    PayloadType,
    QueryParamsType,
    ErrorType | RequestErrorType,
    EndpointType,
    HasData,
    HasParams,
    HasQuery
  > = async (options?: FetchType<PayloadType, QueryParamsType, EndpointType, HasData, HasParams, HasQuery>) => {
    const { client } = this.builder;
    const command = this.clone(
      options as DefaultOptionsType<
        ResponseType,
        PayloadType,
        QueryParamsType,
        ErrorType | RequestErrorType,
        EndpointType,
        ClientOptions
      >,
    );

    return client(command);
  };

  /**
   * Method used to perform requests with usage of cache and queues
   * @param options
   */
  public send: FetchMethodType<
    ResponseType,
    PayloadType,
    QueryParamsType,
    ErrorType | RequestErrorType,
    EndpointType,
    HasData,
    HasParams,
    HasQuery,
    FetchCommandQueueOptions
  > = async (
    options?: FetchType<
      PayloadType,
      QueryParamsType,
      EndpointType,
      HasData,
      HasParams,
      HasQuery,
      FetchCommandQueueOptions
    >,
  ) => {
    const { fetchQueue, submitQueue } = this.builder;
    const command = this.clone(
      options as DefaultOptionsType<
        ResponseType,
        PayloadType,
        QueryParamsType,
        ErrorType | RequestErrorType,
        EndpointType,
        ClientOptions
      >,
    );

    const isGet = command.method === HttpMethodsEnum.get;

    const queueType = options?.queueType || "auto";
    const isFetchQueue = (queueType === "auto" && isGet) || queueType === "fetch";
    const queue = isFetchQueue ? fetchQueue : submitQueue;

    return new Promise<ClientResponseType<ResponseType, ErrorType | RequestErrorType>>((resolve) => {
      const unmount = this.builder.commandManager.events.onResponse<ResponseType, ErrorType | RequestErrorType>(
        command.cacheKey,
        (response) => {
          unmount();
          resolve(response);
        },
      );

      queue.add(command);

      this.logger.http(`Performing send method and adding command to ${isFetchQueue ? "fetch" : "submit"} queue`, {
        command,
      });
    });
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

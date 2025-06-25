/* eslint-disable class-methods-use-this */
import { EmptyTypes, ExtendRequest } from "types";
import { getAdapterOnError, getAdapterBindings } from "./adapter.bindings";
import {
  EndpointMapper,
  AdapterFetcherType,
  AdapterPayloadMappingType,
  HeaderMappingType,
  QueryParamsMapper,
  QueryParamsType,
  RequestResponseType,
  ResponseType,
} from "./adapter.types";
import { RequestInstance, RequestOptionsType } from "request";
import { Client, ClientInstance } from "client";
import { mocker } from "mocker";
import { LoggerMethods } from "managers";
import { getAdapterHeaders, getAdapterPayload, getErrorMessage, RequestProcessingError } from "./adapter.utils";

export type DefaultMapperType = <V, C>(value: V, config: C) => V;
export const defaultMapper: DefaultMapperType = (value) => value;

export class Adapter<
  AdapterOptions,
  MethodType extends string,
  StatusType extends number | string,
  Extra extends Record<string, any>,
  QueryParams = QueryParamsType | string | EmptyTypes,
  DefaultQueryParams = undefined,
  EndpointType = string,
  EndpointMapperType extends EndpointMapper<EndpointType> | DefaultMapperType = DefaultMapperType,
  QueryParamsMapperType extends QueryParamsMapper<QueryParams> | DefaultMapperType = DefaultMapperType,
  HeaderMapperType extends HeaderMappingType | DefaultMapperType = DefaultMapperType,
  PayloadMapperType extends AdapterPayloadMappingType | DefaultMapperType = DefaultMapperType,
> {
  /** Fetching function */
  public unstable_fetcher: AdapterFetcherType<
    Adapter<
      AdapterOptions,
      MethodType,
      StatusType,
      Extra,
      QueryParams,
      DefaultQueryParams,
      EndpointType,
      EndpointMapperType,
      QueryParamsMapperType,
      HeaderMapperType,
      PayloadMapperType
    >
  >;

  /**
   * ********************
   * Defaults
   * ********************
   */

  public name: string;
  public defaultMethod: MethodType;
  public defaultExtra: Extra;
  public systemErrorStatus: StatusType;
  public systemErrorExtra: Extra;
  public defaultRequestOptions?: RequestOptionsType<EndpointType, AdapterOptions, MethodType>;
  public logger: LoggerMethods;
  public initialized = false;
  public client: ClientInstance;

  public unstable_onInitializeCallback?: (options: { client: ClientInstance }) => void;

  public unstable_queryParamsMapperConfig: Parameters<QueryParamsMapperType>[1];
  public unstable_headerMapperConfig: Parameters<HeaderMapperType>[1];
  public unstable_payloadMapperConfig: Parameters<PayloadMapperType>[1];
  public unstable_endpointMapperConfig: Parameters<EndpointMapperType>[1];

  constructor(
    public options: {
      name: string;
      defaultMethod: MethodType;
      defaultExtra: Extra;
      systemErrorStatus: StatusType;
      systemErrorExtra: Extra;
      defaultRequestOptions?: RequestOptionsType<EndpointType, AdapterOptions, MethodType>;
    },
  ) {
    this.name = options.name;
    this.defaultMethod = options.defaultMethod;
    this.defaultExtra = options.defaultExtra;
    this.systemErrorStatus = options.systemErrorStatus;
    this.systemErrorExtra = options.systemErrorExtra;
    this.defaultRequestOptions = options.defaultRequestOptions;
  }

  initialize = (client: ClientInstance) => {
    this.logger = client.loggerManager.initialize(client, "Adapter");
    this.initialized = true;
    this.client = client;

    this.unstable_onInitializeCallback?.({ client });
    return this;
  };

  onInitialize = (callback: (options: { client: ClientInstance }) => void) => {
    this.unstable_onInitializeCallback = callback;
    return this;
  };

  /**
   * ********************
   * Options Setters
   * ********************
   */

  public unstable_internalErrorMapping: (error: ReturnType<typeof getErrorMessage>) => any = (error) => error;
  /** Method to get default headers and to map them based on the data format exchange, by default it handles FormData / JSON formats. */
  public unstable_headerMapper: HeaderMapperType = getAdapterHeaders as HeaderMapperType;
  /** Method to get request data and transform them to the required format. It handles FormData and JSON by default. */
  public unstable_payloadMapper: PayloadMapperType = getAdapterPayload as PayloadMapperType;
  /** Method to get the endpoint for the adapter request. */
  public unstable_endpointMapper: EndpointMapperType = defaultMapper as EndpointMapperType;
  /** Method to get request data and transform them to the required format.  */
  public unstable_queryParamsMapper: QueryParamsMapperType = defaultMapper as QueryParamsMapperType;
  /** Get default adapter options for the request. */
  public unstable_getAdapterDefaults?: (
    request: ExtendRequest<
      RequestInstance,
      {
        client: Client<
          any,
          Adapter<
            AdapterOptions,
            MethodType,
            StatusType,
            Extra,
            QueryParams,
            DefaultQueryParams,
            EndpointType,
            EndpointMapperType,
            QueryParamsMapperType,
            HeaderMapperType,
            PayloadMapperType
          >
        >;
      }
    >,
  ) => AdapterOptions;
  /** Get default request options for the request. */
  public unstable_getRequestDefaults?: (
    options: RequestOptionsType<EndpointType, AdapterOptions, MethodType>,
  ) => Partial<RequestOptionsType<EndpointType, AdapterOptions, MethodType>>;
  /**
   * Get formatted endpoint name of the request.
   * Helpful in displaying long endpoints like in case of graphql schemas etc.
   */
  public unstable_devtoolsEndpointGetter: (endpoint: string) => string = (endpoint) => endpoint;

  /**
   * ********************
   * Methods
   * ********************
   */

  setDefaultMethod = (method: MethodType) => {
    this.defaultMethod = method;
    return this;
  };

  setDefaultExtra = (extra: Extra) => {
    this.defaultExtra = extra;
    return this;
  };

  setDevtoolsEndpointGetter = (callback: (endpoint: string) => string) => {
    this.unstable_devtoolsEndpointGetter = callback;
    return this;
  };

  /**
   * This method allows to configure global defaults for the request configuration like method, auth, deduplication etc.
   */
  setRequestDefaults = (callback: typeof this.unstable_getRequestDefaults): this => {
    this.unstable_getRequestDefaults = callback;
    return this;
  };

  /**
   * Set the adapter default options added to every sent request
   */
  setAdapterDefaults = (
    callback: (
      request: ExtendRequest<
        RequestInstance,
        {
          // No need for global error type, because we haven't sent the request yet
          client: Client<
            any,
            Adapter<
              AdapterOptions,
              MethodType,
              StatusType,
              Extra,
              QueryParams,
              DefaultQueryParams,
              EndpointType,
              EndpointMapperType,
              QueryParamsMapperType,
              HeaderMapperType,
              PayloadMapperType
            >
          >;
        }
      >,
    ) => AdapterOptions,
  ): this => {
    this.unstable_getAdapterDefaults = callback;
    return this;
  };

  setInternalErrorMapping = (callback: (error: ReturnType<typeof getErrorMessage>) => any) => {
    this.unstable_internalErrorMapping = callback;
    return this;
  };

  /**
   * Set the custom header mapping function
   */
  setHeaderMapper = <NewMapper extends HeaderMappingType>(headerMapper: NewMapper) => {
    this.unstable_headerMapper = ((req: Parameters<NewMapper>[0]) =>
      headerMapper(req, this.unstable_headerMapperConfig as Parameters<NewMapper>[1])) as unknown as HeaderMapperType;
    return this as unknown as Adapter<
      AdapterOptions,
      MethodType,
      StatusType,
      Extra,
      QueryParams,
      DefaultQueryParams,
      EndpointType,
      EndpointMapperType,
      QueryParamsMapperType,
      NewMapper,
      PayloadMapperType
    >;
  };

  /**
   * Set the request payload mapping function which gets triggered before request is send
   */
  setPayloadMapper = <NewMapper extends AdapterPayloadMappingType>(payloadMapper: NewMapper) => {
    this.unstable_payloadMapper = ((req: Parameters<NewMapper>[0]) =>
      payloadMapper(
        req,
        this.unstable_payloadMapperConfig as Parameters<NewMapper>[1],
      )) as unknown as PayloadMapperType;
    return this as unknown as Adapter<
      AdapterOptions,
      MethodType,
      StatusType,
      Extra,
      QueryParams,
      DefaultQueryParams,
      EndpointType,
      EndpointMapperType,
      QueryParamsMapperType,
      HeaderMapperType,
      NewMapper
    >;
  };

  /**
   * Set the request payload mapping function which get triggered before request get sent
   */
  setEndpointMapper = <NewEndpointMapper extends EndpointMapper<EndpointType>>(endpointMapper: NewEndpointMapper) => {
    this.unstable_endpointMapper = ((endpoint: Parameters<NewEndpointMapper>[0]) =>
      endpointMapper(
        endpoint,
        this.unstable_endpointMapperConfig as Parameters<NewEndpointMapper>[1],
      )) as unknown as EndpointMapperType;
    return this as unknown as Adapter<
      AdapterOptions,
      MethodType,
      StatusType,
      Extra,
      QueryParams,
      DefaultQueryParams,
      EndpointType,
      NewEndpointMapper,
      QueryParamsMapperType,
      HeaderMapperType,
      PayloadMapperType
    >;
  };

  /**
   * Set the query params mapping function which get triggered before request get sent
   */
  setQueryParamsMapper = <NewQueryParamsMapper extends QueryParamsMapper<QueryParams>>(
    queryParamsMapper: NewQueryParamsMapper,
  ) => {
    this.unstable_queryParamsMapper = ((queryParams: Parameters<NewQueryParamsMapper>[0]) =>
      queryParamsMapper(
        queryParams,
        this.unstable_queryParamsMapperConfig as Parameters<NewQueryParamsMapper>[1],
      )) as unknown as QueryParamsMapperType;
    return this as unknown as Adapter<
      AdapterOptions,
      MethodType,
      StatusType,
      Extra,
      QueryParams,
      DefaultQueryParams,
      EndpointType,
      EndpointMapperType,
      NewQueryParamsMapper,
      HeaderMapperType,
      PayloadMapperType
    >;
  };

  setQueryParamsMapperConfig = <NewQueryParamsMapperConfig extends Parameters<QueryParamsMapperType>[1]>(
    config: NewQueryParamsMapperConfig,
  ) => {
    this.unstable_queryParamsMapperConfig = config;
    return this;
  };

  setHeaderMapperConfig = <NewHeaderMapperConfig extends Parameters<HeaderMapperType>[1]>(
    config: NewHeaderMapperConfig,
  ) => {
    this.unstable_headerMapperConfig = config;
    return this;
  };

  setEndpointMapperConfig = <NewEndpointMapperConfig extends Parameters<EndpointMapperType>[1]>(
    config: NewEndpointMapperConfig,
  ) => {
    this.unstable_endpointMapperConfig = config;
    return this;
  };

  setPayloadMapperConfig = <NewPayloadMapperConfig extends Parameters<PayloadMapperType>[1]>(
    config: NewPayloadMapperConfig,
  ) => {
    this.unstable_payloadMapperConfig = config;
    return this;
  };

  /**
   * ********************
   * Fetching
   * ********************
   */

  public setFetcher(
    fetcher: AdapterFetcherType<
      Adapter<
        AdapterOptions,
        MethodType,
        StatusType,
        Extra,
        QueryParams,
        DefaultQueryParams,
        EndpointType,
        EndpointMapperType,
        QueryParamsMapperType,
        HeaderMapperType,
        PayloadMapperType
      >
    >,
  ) {
    this.unstable_fetcher = fetcher.bind(this);
    return this;
  }

  public async fetch(
    request: ExtendRequest<
      RequestInstance,
      {
        // No need for global error type, it doesn't matter to the fetcher itself
        client: Client<
          any,
          Adapter<
            AdapterOptions,
            MethodType,
            StatusType,
            Extra,
            QueryParams,
            DefaultQueryParams,
            EndpointType,
            EndpointMapperType,
            QueryParamsMapperType,
            HeaderMapperType,
            PayloadMapperType
          >
        >;
      }
    >,
    requestId: string,
  ): Promise<RequestResponseType<RequestInstance>> {
    let startTime: number | undefined;

    const execute = async (resolve: (value: ResponseType<any, any, any>) => void) => {
      try {
        if (!this.initialized) {
          throw new RequestProcessingError(`Adapter ${this.options.name} is not initialized`);
        }

        if (!this.unstable_fetcher) {
          throw new RequestProcessingError(`Fetcher for ${this.options.name} adapter is not set`);
        }

        this.client.triggerPlugins("onAdapterFetch", {
          adapter: this,
          request,
          requestId,
        });

        const bindings = await getAdapterBindings<
          Adapter<
            AdapterOptions,
            MethodType,
            StatusType,
            Extra,
            QueryParams,
            DefaultQueryParams,
            EndpointType,
            EndpointMapperType,
            QueryParamsMapperType,
            HeaderMapperType,
            PayloadMapperType
          >
        >({
          request,
          requestId,
          resolve,
          internalErrorMapping: this.unstable_internalErrorMapping,
          onStartTime: (time) => {
            startTime = time;
          },
        });

        if (request.unstable_mock && request.isMockerEnabled && request.client.isMockerEnabled) {
          return mocker<
            Adapter<
              AdapterOptions,
              MethodType,
              StatusType,
              Extra,
              QueryParams,
              DefaultQueryParams,
              EndpointType,
              EndpointMapperType,
              QueryParamsMapperType,
              HeaderMapperType,
              PayloadMapperType
            >
          >(bindings);
        }

        return this.unstable_fetcher(bindings);
      } catch (error) {
        const onError = getAdapterOnError({
          request,
          requestId,
          startTime: startTime || Date.now(),
          logger: this.logger,
          resolve,
        });

        return onError({
          error: this.unstable_internalErrorMapping(error as ReturnType<typeof getErrorMessage>),
          status: this.options.systemErrorStatus,
          extra: this.options.systemErrorExtra,
        });
      }
    };

    const promise = new Promise((resolve) => {
      execute(resolve);
    });

    return promise as Promise<RequestResponseType<RequestInstance>>;
  }
}

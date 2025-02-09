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
import { getAdapterHeaders, getAdapterPayload } from "../client/client.utils";

export type DefaultMapperType = <V, C>(value: V, config: C) => V;
export const defaultMapper: DefaultMapperType = (value) => value;

export class Adapter<
  AdapterOptions,
  MethodType extends string,
  StatusType extends number | string,
  Extra extends Record<string, any>,
  QueryParams = QueryParamsType | string | EmptyTypes,
  EndpointType = string,
  EndpointMapperType extends EndpointMapper<EndpointType> | DefaultMapperType = DefaultMapperType,
  QueryParamsMapperType extends QueryParamsMapper<QueryParams> | DefaultMapperType = DefaultMapperType,
  HeaderMapperType extends HeaderMappingType | DefaultMapperType = DefaultMapperType,
  PayloadMapperType extends AdapterPayloadMappingType | DefaultMapperType = DefaultMapperType,
> {
  /** Fetching function */
  public unsafe_fetcher: AdapterFetcherType<
    Adapter<
      AdapterOptions,
      MethodType,
      StatusType,
      Extra,
      QueryParams,
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

  public unsafe_onInitializeCallback: (client: ClientInstance) => void;

  public unsafe_queryParamsMapperConfig: Parameters<QueryParamsMapperType>[1];
  public unsafe_headerMapperConfig: Parameters<HeaderMapperType>[1];
  public unsafe_payloadMapperConfig: Parameters<PayloadMapperType>[1];
  public unsafe_endpointMapperConfig: Parameters<EndpointMapperType>[1];

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
  };

  onInitialize = (callback: (client: ClientInstance) => void) => {
    this.unsafe_onInitializeCallback = callback;
    return this;
  };

  /**
   * ********************
   * Options Setters
   * ********************
   */

  /** Method to get default headers and to map them based on the data format exchange, by default it handles FormData / JSON formats. */
  public unsafe_headerMapper: HeaderMapperType = getAdapterHeaders as HeaderMapperType;
  /** Method to get request data and transform them to the required format. It handles FormData and JSON by default. */
  public unsafe_payloadMapper: PayloadMapperType = getAdapterPayload as PayloadMapperType;
  /** Method to get the endpoint for the adapter request. */
  public unsafe_endpointMapper: EndpointMapperType = defaultMapper as EndpointMapperType;
  /** Method to get request data and transform them to the required format.  */
  public unsafe_queryParamsMapper: QueryParamsMapperType = defaultMapper as QueryParamsMapperType;
  /** Get default adapter options for the request. */
  public unsafe_getAdapterDefaults?: (
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
  public unsafe_requestDefaults?: (
    options: RequestOptionsType<EndpointType, AdapterOptions, MethodType>,
  ) => Partial<RequestOptionsType<EndpointType, AdapterOptions, MethodType>>;

  /**
   * ********************
   * Methods
   * ********************
   */

  /**
   * This method allows to configure global defaults for the request configuration like method, auth, deduplication etc.
   */
  setRequestDefaults = (callback: typeof this.unsafe_requestDefaults): this => {
    this.unsafe_requestDefaults = callback;
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
    this.unsafe_getAdapterDefaults = callback;
    return this;
  };

  /**
   * Set the custom header mapping function
   */
  setHeaderMapper = <NewMapper extends HeaderMappingType>(headerMapper: NewMapper) => {
    this.unsafe_headerMapper = ((req: Parameters<NewMapper>[0]) =>
      headerMapper(req, this.unsafe_headerMapperConfig as Parameters<NewMapper>[1])) as unknown as HeaderMapperType;
    return this as unknown as Adapter<
      AdapterOptions,
      MethodType,
      StatusType,
      Extra,
      QueryParams,
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
    this.unsafe_payloadMapper = ((req: Parameters<NewMapper>[0]) =>
      payloadMapper(req, this.unsafe_payloadMapperConfig as Parameters<NewMapper>[1])) as unknown as PayloadMapperType;
    return this as unknown as Adapter<
      AdapterOptions,
      MethodType,
      StatusType,
      Extra,
      QueryParams,
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
    this.unsafe_endpointMapper = ((endpoint: Parameters<NewEndpointMapper>[0]) =>
      endpointMapper(
        endpoint,
        this.unsafe_endpointMapperConfig as Parameters<NewEndpointMapper>[1],
      )) as unknown as EndpointMapperType;
    return this as unknown as Adapter<
      AdapterOptions,
      MethodType,
      StatusType,
      Extra,
      QueryParams,
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
    this.unsafe_queryParamsMapper = ((queryParams: Parameters<NewQueryParamsMapper>[0]) =>
      queryParamsMapper(
        queryParams,
        this.unsafe_queryParamsMapperConfig as Parameters<NewQueryParamsMapper>[1],
      )) as unknown as QueryParamsMapperType;
    return this as unknown as Adapter<
      AdapterOptions,
      MethodType,
      StatusType,
      Extra,
      QueryParams,
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
    this.unsafe_queryParamsMapperConfig = config;
    return this;
  };

  setHeaderMapperConfig = <NewHeaderMapperConfig extends Parameters<HeaderMapperType>[1]>(
    config: NewHeaderMapperConfig,
  ) => {
    this.unsafe_headerMapperConfig = config;
    return this;
  };

  setEndpointMapperConfig = <NewEndpointMapperConfig extends Parameters<EndpointMapperType>[1]>(
    config: NewEndpointMapperConfig,
  ) => {
    this.unsafe_endpointMapperConfig = config;
    return this;
  };

  setPayloadMapperConfig = <NewPayloadMapperConfig extends Parameters<PayloadMapperType>[1]>(
    config: NewPayloadMapperConfig,
  ) => {
    this.unsafe_payloadMapperConfig = config;
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
        EndpointType,
        EndpointMapperType,
        QueryParamsMapperType,
        HeaderMapperType,
        PayloadMapperType
      >
    >,
  ) {
    this.unsafe_fetcher = fetcher.bind(this);
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
          throw new Error(`Adapter ${this.options.name} is not initialized`);
        }

        if (!this.unsafe_fetcher) {
          throw new Error(`Fetcher for ${this.options.name} adapter is not set`);
        }

        const bindings = getAdapterBindings.bind(this);

        const config = await bindings<
          Adapter<
            AdapterOptions,
            MethodType,
            StatusType,
            Extra,
            QueryParams,
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
          onStartTime: (time) => {
            startTime = time;
          },
        });

        if (request.unsafe_mock && request.isMockerEnabled && request.client.isMockerEnabled) {
          return mocker<
            Adapter<
              AdapterOptions,
              MethodType,
              StatusType,
              Extra,
              QueryParams,
              EndpointType,
              EndpointMapperType,
              QueryParamsMapperType,
              HeaderMapperType,
              PayloadMapperType
            >
          >({
            request,
            systemErrorStatus: this.options.systemErrorStatus,
            systemErrorExtra: this.options.systemErrorExtra,
            callbacks: config,
          });
        }

        return this.unsafe_fetcher(config);
      } catch (error) {
        const onError = getAdapterOnError({
          startTime: startTime || +new Date(),
          request,
          client: request.client,
          requestId,
          resolve,
          logger: this.logger,
        });

        return onError({
          error,
          status: this.options.systemErrorStatus,
          extra: this.options.systemErrorExtra,
        });
      }
    };

    const promise = new Promise((resolve) => {
      // Wrapper to resolve the promise in the unsafe_fetcher context
      execute(resolve);
    });

    return promise as Promise<RequestResponseType<RequestInstance>>;
  }
}

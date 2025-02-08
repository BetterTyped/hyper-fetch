/* eslint-disable class-methods-use-this */
import { ExtendRequest } from "types";
import { getAdapterOnError, getAdapterBindings } from "./adapter.bindings";
import {
  EndpointMapper,
  AdapterFetcherType,
  AdapterPayloadMappingType,
  HeaderMappingType,
  QueryParamsMapper,
  QueryParamsType,
  RequestResponseType,
} from "./adapter.types";
import { RequestInstance, RequestOptionsType } from "request";
import { Client, ClientInstance } from "client";
import { mocker } from "mocker";
import { LoggerMethods } from "managers";
import { getAdapterHeaders, getAdapterPayload } from "../client/client.utils";

const defaultMapper = (value: any) => value;

export class Adapter<
  AdapterOptions,
  MethodType extends string,
  StatusType extends number | string,
  Extra extends Record<string, any>,
  QueryParams = QueryParamsType | string | null,
  EndpointType = string,
  EndpointMapperType extends EndpointMapper<EndpointType> | ((value: EndpointType) => string) = (
    value: EndpointType,
  ) => string,
  QueryParamsMapperType extends QueryParamsMapper<QueryParams> | ((value: QueryParams) => QueryParams) = (
    value: QueryParams,
  ) => QueryParams,
  HeaderMapperType extends HeaderMappingType | ((value: RequestInstance) => HeadersInit) = (
    value: RequestInstance,
  ) => HeadersInit,
  PayloadMapperType extends
    | AdapterPayloadMappingType
    | ((options: { request: RequestInstance; payload: unknown }) => unknown) = (options: {
    request: RequestInstance;
    payload: unknown;
  }) => unknown,
> {
  private fetcher: any;

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

  /**
   * ********************
   * Options Setters
   * ********************
   */

  /** Method to get default headers and to map them based on the data format exchange, by default it handles FormData / JSON formats. */
  public headerMapper: HeaderMapperType = getAdapterHeaders as HeaderMapperType;
  /** Method to get request data and transform them to the required format. It handles FormData and JSON by default. */
  public payloadMapper: PayloadMapperType = getAdapterPayload as PayloadMapperType;
  /** Method to get the endpoint for the adapter request. */
  public endpointMapper: EndpointMapperType = defaultMapper as EndpointMapperType;
  /** Method to get request data and transform them to the required format.  */
  public queryParamsMapper: QueryParamsMapperType = defaultMapper as QueryParamsMapperType;
  /** Get default adapter options for the request. */
  public getAdapterDefaults?: (
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
  public requestDefaults?: (
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
  setRequestDefaults = (callback: typeof this.requestDefaults): this => {
    this.requestDefaults = callback;
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
    this.getAdapterDefaults = callback;
    return this;
  };

  /**
   * Set the custom header mapping function
   */
  setHeaderMapper = <NewMapper extends HeaderMappingType>(headerMapper: NewMapper) => {
    this.headerMapper = headerMapper as unknown as HeaderMapperType;
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
    this.payloadMapper = payloadMapper as unknown as PayloadMapperType;
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
    this.endpointMapper = endpointMapper as unknown as EndpointMapperType;
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
    this.queryParamsMapper = queryParamsMapper as unknown as QueryParamsMapperType;
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
    this.fetcher = fetcher;
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
        queryParams?: QueryParams;
      }
    >,
    requestId: string,
  ): Promise<RequestResponseType<RequestInstance>> {
    let startTime: number | undefined;

    return new Promise((resolve) => {
      const execute = async () => {
        try {
          if (!this.initialized) {
            throw new Error(`Adapter ${this.options.name} is not initialized`);
          }

          if (!this.fetcher) {
            throw new Error(`Fetcher for ${this.options.name} adapter is not set`);
          }
          const { url } = request.client;

          const config = await getAdapterBindings<
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

          const queryParams = this.queryParamsMapper(request.queryParams as QueryParams);
          const endpoint = this.endpointMapper(request.endpoint);
          const headers = this.headerMapper(request);

          return this.fetcher({
            ...config,
            url,
            queryParams,
            endpoint,
            headers,
            request,
          });
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

      execute();
    });
  }
}

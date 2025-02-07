import { ExtendRequest } from "types";
import { getAdapterOnError, getAdapterBindings } from "./adapter.bindings";
import { AdapterFetcherType, AdapterPayloadMappingType, HeaderMappingType, QueryParamsType } from "./adapter.types";
import { RequestInstance, RequestOptionsType } from "request";
import { Client, ClientInstance, getAdapterHeaders, getAdapterPayload } from "client";
import { mocker } from "mocker";
import { LoggerMethods } from "managers";

export type EndpointMapper<EndpointType> = (endpoint: EndpointType) => string;

export type EndpointMapperOptions<EndpointType> = EndpointType extends string
  ? { endpointMapper?: EndpointMapper<EndpointType> }
  : { endpointMapper: EndpointMapper<EndpointType> };

export class Adapter<
  AdapterOptions,
  MethodType extends string,
  StatusType extends number | string,
  Extra extends Record<string, any>,
  QueryParams = QueryParamsType | string | null,
  EndpointType = string,
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
  public headerMapper: HeaderMappingType = getAdapterHeaders;
  /** Method to get request data and transform them to the required format. It handles FormData and JSON by default. */
  public payloadMapper: AdapterPayloadMappingType = getAdapterPayload;
  /** Method to get request data and transform them to the required format. It handles FormData and JSON by default. */
  public endpointMapper: EndpointMapper<EndpointType> = ((endpoint) => endpoint) as EndpointMapper<EndpointType>;
  /** Get default adapter options for the request. */
  public getAdapterDefaults?: (
    request: ExtendRequest<
      RequestInstance,
      {
        client: Client<any, Adapter<AdapterOptions, MethodType, StatusType, Extra, QueryParams, EndpointType>>;
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
          client: Client<any, Adapter<AdapterOptions, MethodType, StatusType, Extra, QueryParams, EndpointType>>;
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
  setHeaderMapper = (headerMapper: HeaderMappingType): this => {
    this.headerMapper = headerMapper;
    return this;
  };

  /**
   * Set the request payload mapping function which gets triggered before request is send
   */
  setPayloadMapper = (payloadMapper: AdapterPayloadMappingType): this => {
    this.payloadMapper = payloadMapper;
    return this;
  };

  /**
   * Set the request payload mapping function which get triggered before request get sent
   */
  setEndpointMapper = <NewEndpointMapper extends EndpointMapper<EndpointType>>(endpointMapper: NewEndpointMapper) => {
    this.endpointMapper = endpointMapper;
    return this;
  };

  /**
   * ********************
   * Fetching
   * ********************
   */

  public setFetcher(
    fetcher: AdapterFetcherType<Adapter<AdapterOptions, MethodType, StatusType, Extra, QueryParams, EndpointType>>,
  ) {
    this.fetcher = fetcher;
    return this;
  }

  public async fetch(
    request: ExtendRequest<
      RequestInstance,
      {
        // No need for global error type, it doesn't matter to the fetcher itself
        client: Client<any, Adapter<AdapterOptions, MethodType, StatusType, Extra, QueryParams, EndpointType>>;
        queryParams?: QueryParams;
      }
    >,
    requestId: string,
  ) {
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

          const config = await getAdapterBindings<
            Adapter<AdapterOptions, MethodType, StatusType, Extra, QueryParams, EndpointType>
          >({
            request,
            requestId,
            resolve,
            onStartTime: (time) => {
              startTime = time;
            },
          });

          if (request.mock && request.isMockerEnabled && request.client.isMockerEnabled) {
            return mocker<Adapter<AdapterOptions, MethodType, StatusType, Extra, QueryParams, EndpointType>>({
              request,
              systemErrorStatus: this.options.systemErrorStatus,
              systemErrorExtra: this.options.systemErrorExtra,
              callbacks: config,
            });
          }

          return this.fetcher({
            ...config,
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

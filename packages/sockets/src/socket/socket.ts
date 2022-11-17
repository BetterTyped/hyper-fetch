import {
  ResponseInterceptorCallback,
  RequestInterceptorCallback,
  stringifyQueryParams,
  StringifyCallbackType,
  ClientHeaderMappingCallback,
  getClientHeaders,
  ClientPayloadMappingCallback,
  getClientPayload,
  QueryStringifyOptions,
  LoggerManager,
  SeverityType,
} from "@hyper-fetch/core";

import { SocketConfig } from "socket";
import { ClientType } from "client";

export class Socket<GlobalErrorType, SocketOptionsType> {
  readonly baseUrl: string;
  readonly isNodeJS: boolean;
  readonly reconnect: number;
  readonly reconnectTime: number;
  debug: boolean;

  // Private
  __onErrorCallbacks: ResponseInterceptorCallback[] = [];
  __onSuccessCallbacks: ResponseInterceptorCallback[] = [];
  __onResponseCallbacks: ResponseInterceptorCallback[] = [];
  __onAuthCallbacks: RequestInterceptorCallback[] = [];
  __onRequestCallbacks: RequestInterceptorCallback[] = [];

  // Config
  client: unknown;
  loggerManager = new LoggerManager(this);

  // Options
  // requestConfig?: (command: CommandInstance) => SocketOptionsType;
  // commandConfig?: (
  //   commandOptions: CommandConfig<string, SocketOptionsType>,
  // ) => Partial<CommandConfig<string, SocketOptionsType>>;
  queryParamsConfig?: QueryStringifyOptions;

  // Utils

  /**
   * Method to stringify query params from objects.
   */
  stringifyQueryParams: StringifyCallbackType = (queryParams) =>
    stringifyQueryParams(queryParams, this.queryParamsConfig);
  /**
   * Method to get default headers and to map them based on the data format exchange, by default it handles FormData / JSON formats.
   */
  headerMapper: ClientHeaderMappingCallback = getClientHeaders;
  /**
   * Method to get request data and transform them to the required format. It handles FormData and JSON by default.
   */
  payloadMapper: ClientPayloadMappingCallback = getClientPayload;

  // Logger
  logger = this.loggerManager.init("Builder");

  constructor(public options: SocketConfig) {
    const { baseUrl, client, reconnect, reconnectTime } = this.options;
    this.baseUrl = baseUrl;
    // TODO add default
    this.client = client || null;
    this.reconnect = reconnect ?? 10;
    this.reconnectTime = reconnectTime ?? 2000;
  }

  /**
   * This method enables the logger usage and display the logs in console
   */
  setDebug = (debug: boolean): Socket<GlobalErrorType, SocketOptionsType> => {
    this.debug = debug;
    return this;
  };

  /**
   * Set the logger severity of the messages displayed to the console
   */
  setLoggerSeverity = (severity: SeverityType): Socket<GlobalErrorType, SocketOptionsType> => {
    this.loggerManager.setSeverity(severity);
    return this;
  };

  /**
   * Set the new logger instance to the builder
   */
  setLogger = (
    callback: (socket: Socket<GlobalErrorType, SocketOptionsType>) => LoggerManager,
  ): Socket<GlobalErrorType, SocketOptionsType> => {
    this.loggerManager = callback(this);
    return this;
  };

  /**
   * Set config for the query params stringify method, we can set here, among others, arrayFormat, skipNull, encode, skipEmptyString and more
   */
  setQueryParamsConfig = (queryParamsConfig: QueryStringifyOptions): Socket<GlobalErrorType, SocketOptionsType> => {
    this.queryParamsConfig = queryParamsConfig;
    return this;
  };

  /**
   * Set the custom query params stringify method to the builder
   * @param stringifyFn Custom callback handling query params stringify
   */
  setStringifyQueryParams = (stringifyFn: StringifyCallbackType): Socket<GlobalErrorType, SocketOptionsType> => {
    this.stringifyQueryParams = stringifyFn;
    return this;
  };

  /**
   * Set the custom header mapping function
   */
  setHeaderMapper = (headerMapper: ClientHeaderMappingCallback): Socket<GlobalErrorType, SocketOptionsType> => {
    this.headerMapper = headerMapper;
    return this;
  };

  /**
   * Set custom http client to handle graphql, rest, firebase or other
   */
  setClient = (
    callback: (builder: Socket<GlobalErrorType, SocketOptionsType>) => ClientType,
  ): Socket<GlobalErrorType, SocketOptionsType> => {
    this.client = callback(this);
    return this;
  };

  /**
   * Method of manipulating commands before sending the request. We can for example add custom header with token to the request which command had the auth set to true.
   */
  onAuth = (callback: RequestInterceptorCallback): Socket<GlobalErrorType, SocketOptionsType> => {
    this.__onAuthCallbacks.push(callback);
    return this;
  };

  /**
   * Method for intercepting error responses. It can be used for example to refresh tokens.
   */
  onError = <ErrorType = null>(
    callback: ResponseInterceptorCallback<any, ErrorType | GlobalErrorType>,
  ): Socket<GlobalErrorType, SocketOptionsType> => {
    this.__onErrorCallbacks.push(callback);
    return this;
  };

  /**
   * Method for intercepting success responses.
   */
  onSuccess = <ErrorType = null>(
    callback: ResponseInterceptorCallback<any, ErrorType | GlobalErrorType>,
  ): Socket<GlobalErrorType, SocketOptionsType> => {
    this.__onSuccessCallbacks.push(callback);
    return this;
  };

  /**
   * Method of manipulating commands before sending the request.
   */
  onRequest = (callback: RequestInterceptorCallback): Socket<GlobalErrorType, SocketOptionsType> => {
    this.__onRequestCallbacks.push(callback);
    return this;
  };

  /**
   * Method for intercepting any responses.
   */
  onResponse = <ErrorType = null>(
    callback: ResponseInterceptorCallback<any, ErrorType | GlobalErrorType>,
  ): Socket<GlobalErrorType, SocketOptionsType> => {
    this.__onResponseCallbacks.push(callback);
    return this;
  };

  // /**
  //  * Helper used by http client to apply the modifications on response error
  //  */
  // __modifyAuth = async (command: CommandInstance) => interceptRequest(this.__onAuthCallbacks, command);

  // /**
  //  * Private helper to run async pre-request processing
  //  */
  // __modifyRequest = async (command: CommandInstance) => interceptRequest(this.__onRequestCallbacks, command);

  // /**
  //  * Private helper to run async on-error response processing
  //  */
  // __modifyErrorResponse = async (response: ClientResponseType<any, GlobalErrorType>, command: CommandInstance) =>
  //   interceptResponse<GlobalErrorType>(this.__onErrorCallbacks, response, command);

  // /**
  //  * Private helper to run async on-success response processing
  //  */
  // __modifySuccessResponse = async (response: ClientResponseType<any, GlobalErrorType>, command: CommandInstance) =>
  //   interceptResponse<GlobalErrorType>(this.__onSuccessCallbacks, response, command);

  // /**
  //  * Private helper to run async response processing
  //  */
  // __modifyResponse = async (response: ClientResponseType<any, GlobalErrorType>, command: CommandInstance) =>
  //   interceptResponse<GlobalErrorType>(this.__onResponseCallbacks, response, command);

  connect = () => {
    this.client.connect();
    return this;
  };
}

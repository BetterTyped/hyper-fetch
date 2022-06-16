import { ClientType, ClientDefaultOptionsType, ClientResponseType, ClientQueryParamsType, QueryStringifyOptions, ClientHeaderMappingCallback, ClientPayloadMappingCallback } from "client";
import { BuilderConfig, BuilderInstance, BuilderErrorType, StringifyCallbackType, RequestInterceptorCallback, ResponseInterceptorCallback } from "builder";
import { Cache } from "cache";
import { Dispatcher } from "dispatcher";
import { FetchEffectInstance } from "effect";
import { Command, CommandConfig, CommandInstance } from "command";
import { AppManager, CommandManager, LoggerManager, LoggerLevelType } from "managers";
/**
 * **Builder** is a class that allows you to configure the connection with the server and then use it to create
 * commands which, when called using the appropriate method, will cause the server to be queried for the endpoint and
 * method specified in the command.
 */
export declare class Builder<GlobalErrorType extends BuilderErrorType = Error, RequestConfigType = ClientDefaultOptionsType> {
    private options;
    readonly baseUrl: string;
    debug: boolean;
    __onErrorCallbacks: ResponseInterceptorCallback[];
    __onSuccessCallbacks: ResponseInterceptorCallback[];
    __onResponseCallbacks: ResponseInterceptorCallback[];
    __onAuthCallbacks: RequestInterceptorCallback[];
    __onRequestCallbacks: RequestInterceptorCallback[];
    commandManager: CommandManager;
    appManager: AppManager;
    loggerManager: LoggerManager;
    client: ClientType;
    cache: Cache;
    fetchDispatcher: Dispatcher;
    submitDispatcher: Dispatcher;
    effects: FetchEffectInstance[];
    requestConfig?: RequestConfigType;
    commandConfig?: Partial<CommandConfig<string, RequestConfigType>>;
    queryParamsConfig?: QueryStringifyOptions;
    /**
     * Method to stringify query params from objects.
     */
    stringifyQueryParams: StringifyCallbackType;
    /**
     * Method to get default headers and to map them based on the data format exchange, by default it handles FormData / JSON formats.
     */
    headerMapper: ClientHeaderMappingCallback;
    /**
     * Method to get request data and transform them to the required format. It handles FormData and JSON by default.
     */
    payloadMapper: ClientPayloadMappingCallback;
    logger: import("managers").LoggerMethodsType;
    constructor(options: BuilderConfig);
    /**
     * It sets the client request config (by default XHR config). This is the global way to setup the configuration for client and trigger it with every command.
     */
    setRequestConfig: (requestConfig: RequestConfigType) => Builder<GlobalErrorType, RequestConfigType>;
    /**
     * This method allows to configure global defaults for the command configuration like method, auth, deduplication etc.
     */
    setCommandConfig: (commandConfig: Partial<CommandConfig<string, RequestConfigType>>) => Builder<GlobalErrorType, RequestConfigType>;
    /**
     * This method enables the logger usage and display the logs in console
     */
    setDebug: (debug: boolean) => Builder<GlobalErrorType, RequestConfigType>;
    /**
     * Set the logger level of the messages displayed to the console
     */
    setLoggerLevel: (levels: LoggerLevelType[]) => Builder<GlobalErrorType, RequestConfigType>;
    /**
     * Set the new logger instance to the builder
     */
    setLogger: (callback: (builder: BuilderInstance) => LoggerManager) => Builder<GlobalErrorType, RequestConfigType>;
    /**
     * Set config for the query params stringify method, we can set here, among others, arrayFormat, skipNull, encode, skipEmptyString and more
     */
    setQueryParamsConfig: (queryParamsConfig: QueryStringifyOptions) => Builder<GlobalErrorType, RequestConfigType>;
    /**
     * Set the custom query params stringify method to the builder
     * @param stringifyFn Custom callback handling query params stringify
     */
    setStringifyQueryParams: (stringifyFn: StringifyCallbackType) => Builder<GlobalErrorType, RequestConfigType>;
    /**
     * Set the custom header mapping function
     */
    setHeaderMapper: (headerMapper: ClientHeaderMappingCallback) => Builder<GlobalErrorType, RequestConfigType>;
    /**
     * Set the request payload mapping function which get triggered before request get send
     */
    setPayloadMapper: (payloadMapper: ClientPayloadMappingCallback) => Builder<GlobalErrorType, RequestConfigType>;
    /**
     * Set custom http client to handle graphql, rest, firebase or other
     */
    setClient: (callback: (builder: BuilderInstance) => ClientType) => Builder<GlobalErrorType, RequestConfigType>;
    /**
     * Method of manipulating commands before sending the request. We can for example add custom header with token to the request which command had the auth set to true.
     */
    onAuth: (callback: RequestInterceptorCallback) => Builder<GlobalErrorType, RequestConfigType>;
    /**
     * Method for intercepting error responses. It can be used for example to refresh tokens.
     */
    onError: (callback: ResponseInterceptorCallback) => Builder<GlobalErrorType, RequestConfigType>;
    /**
     * Method for intercepting success responses.
     */
    onSuccess: (callback: ResponseInterceptorCallback) => Builder<GlobalErrorType, RequestConfigType>;
    /**
     * Method of manipulating commands before sending the request.
     */
    onRequest: (callback: RequestInterceptorCallback) => Builder<GlobalErrorType, RequestConfigType>;
    /**
     * Method for intercepting any responses.
     */
    onResponse: (callback: ResponseInterceptorCallback) => Builder<GlobalErrorType, RequestConfigType>;
    /**
     * Add persistent effects which trigger on the request lifecycle
     */
    addEffect: (effect: FetchEffectInstance | FetchEffectInstance[]) => this;
    /**
     * Remove effects from builder
     */
    removeEffect: (effect: FetchEffectInstance | string) => this;
    /**
     * Create commands based on the builder setup
     */
    createCommand: <ResponseType_1, PayloadType = undefined, LocalErrorType extends BuilderErrorType = undefined, QueryParamsType extends string | ClientQueryParamsType = string>() => <EndpointType extends string>(params: CommandConfig<EndpointType, RequestConfigType>) => Command<ResponseType_1, PayloadType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, RequestConfigType, false, false, false, undefined>;
    /**
     * Clears the builder instance and remove all listeners on it's dependencies
     */
    clear: () => void;
    /**
     * Helper used by http client to apply the modifications on response error
     */
    __modifyAuth: (command: CommandInstance) => Promise<CommandInstance>;
    /**
     * Private helper to run async pre-request processing
     */
    __modifyRequest: (command: CommandInstance) => Promise<CommandInstance>;
    /**
     * Private helper to run async on-error response processing
     */
    __modifyErrorResponse: (response: ClientResponseType<any, GlobalErrorType>, command: CommandInstance) => Promise<ClientResponseType<any, GlobalErrorType>>;
    /**
     * Private helper to run async on-success response processing
     */
    __modifySuccessResponse: (response: ClientResponseType<any, GlobalErrorType>, command: CommandInstance) => Promise<ClientResponseType<any, GlobalErrorType>>;
    /**
     * Private helper to run async response processing
     */
    __modifyResponse: (response: ClientResponseType<any, GlobalErrorType>, command: CommandInstance) => Promise<ClientResponseType<any, GlobalErrorType>>;
}

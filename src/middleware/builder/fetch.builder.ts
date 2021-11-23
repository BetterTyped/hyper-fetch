import { ClientType, FetchClientOptions, fetchClient } from "client";
import {
  FetchMiddleware,
  FetchMiddlewareOptions,
  RequestInterceptorCallback,
  ResponseInterceptorCallback,
  FetchBuilderProps,
  ErrorMessageMapperCallback,
  FetchMiddlewareInstance,
} from "middleware";

export class FetchBuilder<ErrorType extends Record<string, any> | string, ClientOptions = FetchClientOptions> {
  baseUrl: string;
  debug: boolean;
  options: ClientOptions | undefined;
  client: ClientType<ErrorType, ClientOptions> = fetchClient;

  onErrorCallback: ErrorMessageMapperCallback<ErrorType> | undefined;
  onRequestCallbacks: RequestInterceptorCallback[] = [];
  onResponseCallbacks: ResponseInterceptorCallback[] = [];

  constructor({ baseUrl, debug = false, options }: FetchBuilderProps<ClientOptions>) {
    this.baseUrl = baseUrl;
    this.debug = debug;
    this.options = options;
  }

  setClient = (callback: ClientType<ErrorType, ClientOptions>): FetchBuilder<ErrorType, ClientOptions> => {
    this.client = callback;
    return this;
  };

  onError = (callback: ErrorMessageMapperCallback<ErrorType>): FetchBuilder<ErrorType, ClientOptions> => {
    this.onErrorCallback = callback;
    return this;
  };

  onRequest = (callback: RequestInterceptorCallback): FetchBuilder<ErrorType, ClientOptions> => {
    this.onRequestCallbacks.push(callback);
    return this;
  };

  onResponse = (callback: ResponseInterceptorCallback): FetchBuilder<ErrorType, ClientOptions> => {
    this.onResponseCallbacks.push(callback);
    return this;
  };

  private handleRequestCallbacks = async <T extends FetchMiddlewareInstance>(middleware: T): Promise<T> => {
    let newMiddleware = middleware;
    if (!middleware.apiConfig.disableRequestInterceptors) {
      // eslint-disable-next-line no-restricted-syntax
      for await (const interceptor of this.onRequestCallbacks) {
        newMiddleware = (await interceptor(middleware)) as T;
      }
    }
    return newMiddleware;
  };

  private handleResponseCallbacks = async <T extends FetchMiddlewareInstance>(middleware: T, response: any) => {
    let newResponse = response;
    if (!middleware.apiConfig.disableResponseInterceptors) {
      // eslint-disable-next-line no-restricted-syntax
      for await (const interceptor of this.onResponseCallbacks) {
        newResponse = await interceptor(middleware, response);
      }
    }
    return newResponse;
  };

  private getBuilderConfig = () => ({
    baseUrl: this.baseUrl,
    debug: this.debug,
    options: this.options,
    client: this.client,
    onErrorCallback: this.onErrorCallback,
    onRequestCallbacks: this.handleRequestCallbacks,
    onResponseCallbacks: this.handleResponseCallbacks,
  });

  build() {
    return <ResponseType, PayloadType = undefined>() =>
      <EndpointType extends string>(
        params: FetchMiddlewareOptions<EndpointType, ClientOptions>,
      ): FetchMiddleware<ResponseType, PayloadType, ErrorType, EndpointType, ClientOptions> =>
        new FetchMiddleware<ResponseType, PayloadType, ErrorType, EndpointType, ClientOptions>(
          this.getBuilderConfig(),
          params,
        );
  }
}

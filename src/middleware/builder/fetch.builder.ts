import { ClientType, FetchClientOptions, fetchClient } from "client";
import {
  FetchMiddleware,
  FetchMiddlewareOptions,
  RequestInterceptorCallback,
  ResponseInterceptorCallback,
  FetchBuilderProps,
  ErrorMessageMapperCallback,
} from "middleware";

export class FetchBuilder<ErrorType extends Record<string, any> | string, ClientOptions = FetchClientOptions> {
  private readonly baseUrl: string;
  private readonly debug: boolean;

  private client: ClientType<ErrorType, ClientOptions> = fetchClient;
  private errorMessageMapper: ErrorMessageMapperCallback<ErrorType> | undefined;
  private onRequestCallback: RequestInterceptorCallback | undefined;
  private onResponseCallback: ResponseInterceptorCallback | undefined;

  constructor({ baseUrl, debug = false }: FetchBuilderProps) {
    this.baseUrl = baseUrl;
    this.debug = debug;
  }

  setErrorMessage = (callback: ErrorMessageMapperCallback<ErrorType>): FetchBuilder<ErrorType, ClientOptions> => {
    this.errorMessageMapper = callback;
    return this;
  };

  setClient = (callback: ClientType<ErrorType, ClientOptions>): FetchBuilder<ErrorType, ClientOptions> => {
    this.client = callback;
    return this;
  };

  onRequest = (callback: RequestInterceptorCallback): FetchBuilder<ErrorType, ClientOptions> => {
    this.onRequestCallback = callback;
    return this;
  };

  onResponse = (callback: ResponseInterceptorCallback): FetchBuilder<ErrorType, ClientOptions> => {
    this.onResponseCallback = callback;
    return this;
  };

  private getBuilderConfig = () => ({
    baseUrl: this.baseUrl,
    debug: this.debug,
    client: this.client,
    errorMessageMapper: this.errorMessageMapper,
    onRequest: this.onRequestCallback,
    onResponse: this.onResponseCallback,
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

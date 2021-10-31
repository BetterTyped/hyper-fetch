import { ClientType, FetchClientOptions, fetchClient } from "client";
import { FetchMiddleware, FetchMiddlewareOptions } from "middleware";
import {
  BuilderErrorMapperCallback,
  BuilderHeadersCallback,
  FetchBuilderProps,
} from "./fetch.builder.types";

export class FetchBuilder<
  ErrorType extends Record<string, any> | string,
  ClientOptions = FetchClientOptions,
> {
  private readonly baseUrl: string;
  private errorMapper: BuilderErrorMapperCallback = (error) => error;
  private getHeaders: BuilderHeadersCallback = () => undefined;
  private client: ClientType<ErrorType, ClientOptions> = fetchClient;

  constructor({ baseUrl }: FetchBuilderProps) {
    this.baseUrl = baseUrl;
  }

  setErrorsMapper = (
    callback: BuilderErrorMapperCallback,
  ): FetchBuilder<ErrorType, ClientOptions> => {
    this.errorMapper = callback;
    return this;
  };

  setClient = (
    callback: ClientType<ErrorType, ClientOptions>,
  ): FetchBuilder<ErrorType, ClientOptions> => {
    this.client = callback;
    return this;
  };

  setErrorMapper = (callback: BuilderErrorMapperCallback) => {
    this.errorMapper = callback;
  };

  setHeaders = (callback: BuilderHeadersCallback) => {
    this.getHeaders = callback;
  };

  private getBuilderConfig = () => ({
    baseUrl: this.baseUrl,
    client: this.client,
    errorMapper: this.errorMapper,
    getHeaders: this.getHeaders,
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

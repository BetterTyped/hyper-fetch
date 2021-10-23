import { ClientType, FetchClientOptions } from "client/fetch.client.types";
import { FetchMiddleware } from "./fetch.middleware";
import { FetchMiddlewareOptions } from "./fetch.middleware.types";
import { fetchClient } from "../client/fetch.client";

export type ApiErrorMapperCallback = (errorResponse: any) => string;

export type FetchBuilderProps = {
  baseUrl: string;
};

export class FetchBuilder<
  ErrorType extends Record<string, any> | string,
  ClientOptions = FetchClientOptions,
> {
  private readonly baseUrl: string;
  private errorMapper: ApiErrorMapperCallback = (error) => error;
  private client: ClientType<ErrorType, ClientOptions> = fetchClient;

  constructor({ baseUrl }: FetchBuilderProps) {
    this.baseUrl = baseUrl;
  }

  setErrorsMapper = (callback: ApiErrorMapperCallback): FetchBuilder<ErrorType, ClientOptions> => {
    this.errorMapper = callback;
    return this;
  };

  setClient = (
    callback: ClientType<ErrorType, ClientOptions>,
  ): FetchBuilder<ErrorType, ClientOptions> => {
    this.client = callback;
    return this;
  };

  setErrorMapper = () => {};

  private getBuilderConfig = () => ({
    baseUrl: this.baseUrl,
    client: this.client,
    errorMapper: this.errorMapper,
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

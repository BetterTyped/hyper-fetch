/**
 * FetchBuilder({baseUrl, httpClientOptions})
 * setErrorMapper
 * setHttpClient
 * setHeaders
 *
 * build()
 */
import { FetchMiddleware } from "./fetch.middleware";
import { FetchMiddlewareOptions } from "./fetch.middleware.types";

export type ApiErrorMapperCallback = (errorResponse: any) => string;

export type FetchBuilderProps = {
  baseUrl: string;
  clientOptions?: {};
};

export class FetchBuilder<ErrorType extends Record<string, any> | string> {
  private readonly baseUrl: string;
  private readonly clientOptions?: {};
  private errorMapper: ApiErrorMapperCallback = (error) => error;

  constructor({ baseUrl, clientOptions }: FetchBuilderProps) {
    this.baseUrl = baseUrl;
    this.clientOptions = clientOptions;
  }

  setErrorsMapper = (callback: ApiErrorMapperCallback): FetchBuilder<ErrorType> => {
    this.errorMapper = callback;
    return this;
  };

  private getBuilderConfig = () => ({
    baseUrl: this.baseUrl,
    errorMapper: this.errorMapper,
  });

  build() {
    return <ResponseType, PayloadType>() =>
      <EndpointType extends string>(
        params: FetchMiddlewareOptions<EndpointType>,
      ): FetchMiddleware<ResponseType, PayloadType, ErrorType, EndpointType> =>
        new FetchMiddleware<ResponseType, PayloadType, ErrorType, EndpointType>(
          this.getBuilderConfig(),
          params,
        );
  }

  // 1. Zgromadzić config serwera dla fetch Middleware - czyli baseUrl, httpClientOptions
  // httpClientOptions = { interceptors: [fn, fn, fn] } -> to ma się podłączać pod każdy request i będzie obsłużone w api middleware
  // 2. setErrorMapper
  // - możliwość zmapowania errorów z requestów, zwraca zawsze jeden styl errora {message, originalError}
  // 3. setHttpClient (Wszystko z api middleware) => void
  // - coś w stylu setHttpClient = (callback) => this.httpClient = callback
  // - możliwość podpięcia axiosa / graphql i przekazanie callbacka wgłąb apiMiddleware
  // 4. setHeaders: () => ustawia callback rozszerzający headery
  // - coś w stylu setHeaders = (callback) => this.getAdditionalHeaders = callback
  // - odpowiedzialny za przekazanie callbacka wgłąb apiMiddleware
  // 5. getBuilderConfig: () => void;
  // - zwraca cały konfig potrzebny do wykonania requestu, włącznie z callbackami z powyższych metod
  /**
   * {
   * baseUrl: this.baseUrl
   * httpClient: (options: ApiMiddlewareOptions - endpoint, headery, callbacki itd) => nasz client // albo zewnętrzny
   * errorMapper: (errora) => mapper z callbacku wyżej albo proste przekazanie errora
   * getAdditionalHeaders: () => {} - callback headerów ustawiony przez setHeaders
   * ... - jak coś jeszcze znajdziemy będziemy rozszerzać
   * }
   */
  // 6. build() - zwraca callback z (middlewareOptions: FetchMiddlewareOptions) => fetchMiddleware(this.getBuilderConfig(), middlewareOptions)

  setErrorMapper = () => {};
}

// 1. Używamy wbudowanego w przeglądarkę fetch() -> dajemy solution out of the box

// const fetchMiddleware = new FetchBuilder({
//   baseUrl: "localhost:/3000",
//   httpClientOptions: {},
// }).setHeaders(() => {
//   const token = store.getToken();
//   if(token) {
//     return {}
//   }
//   return { auth: token };
// });

// 2. Użycie zewnętrznego http clienta

// const fetchMiddleware2 = new FetchBuilder({ baseUrl: "localhost:/3000" }).setHttpClient(
//   ({ data, headers, onProgress, baseUrl, endpoint }) => {
//     axios({
//       url: baseUrl + endpoint,
//       data,
//     });
//   },
// );

// Działanie middleware
// const getUser = fetchMiddleware({endpoint, method, headers}:FetchMiddlewareOptions);

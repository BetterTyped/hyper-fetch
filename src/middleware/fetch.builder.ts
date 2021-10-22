/**
 * FetchBuilder({baseUrl, httpClientOptions})
 * setErrorMapper
 * setHttpClient
 * setHeaders
 *
 * build()
 */

export class FetchBuilder {
  // 1. Zgromadzić config serwera dla fetch Middleware - czyli baseUrl, httpClientOptions
  // httpClientOptions = { interceptors: [fn, fn, fn] }
  // 2. setErrorMapper
  // - możliwość zmapowania errorów z requestów, zwraca zawsze jeden styl errora {message, originalError}
  // 3. setHttpClient (Wszystko z api middleware) => void
  // - coś w stylu httpClient = (callback) => this.getAdditionalHeaders = callback
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
  // 6. build - zwraca callback z () => api middleware()
}

// 1. Używamy wbudowanego w przeglądarkę fetch() -> dajemy solution out of the box

// const fetchMiddleware = new FetchBuilder({
//   baseUrl: "localhost:/3000",
//   httpClientOptions: {},
// }).setHeaders(() => {
//   const token = store.getToken();
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

import { FetchMiddleware } from "./fetch.middleware";

export type HttpClientResponseType<GenericDataType, GenericErrorType> = Promise<
  [GenericDataType | null, GenericErrorType | null, number]
>;

export const fetchHttpClient = ({
  endpoint,
  headers,
  apiConfig,
}: FetchMiddleware<any, any, any, any>) => {
  return new Promise<HttpClientResponseType<any, any>>((resolve) => {
    return fetch({
      ...apiConfig.httpClientOptions,
      headers: { ...apiConfig.getAdditionalHeaders(), ...headers },
      url: apiConfig.baseUrl + endpoint,
    })
      .then(({ data, status }: any) => {
        return resolve([data, null, status] as any);
      })
      .catch((error: any) => {
        return resolve([null, error, status] as any);
      });
  });
};

import { ClientResponseType, ClientType, FetchClientOptions } from "./fetch.client.types";

export const fetchClient: ClientType<any, FetchClientOptions> = ({
  endpoint,
  headers,
  method,
  queryParams = "",
  data,
  apiConfig,
  builderConfig,
}) => {
  if (!window.fetch) {
    throw new Error("There is no window.fetch, make sure it's provided when using SSR.");
  }

  const requestOptions = apiConfig.options || {};

  return new Promise<ClientResponseType<any, any>>((resolve) => {
    return fetch(builderConfig.baseUrl + endpoint + queryParams, {
      ...requestOptions,
      headers: { ...builderConfig.getHeaders(), ...headers },
      method,
      body: data instanceof FormData ? data : JSON.stringify(data),
    })
      .then(async (response) => {
        const responseData = await response.json();
        if (response.ok) {
          return resolve([responseData, null, response.status]);
        }
        return resolve([null, responseData, response.status]);
      })
      .catch((error) => {
        return resolve([null, error, 0]);
      });
  });
};

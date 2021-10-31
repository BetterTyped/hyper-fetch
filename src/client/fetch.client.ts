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
  const requestOptions = apiConfig.options || {};

  return new Promise<ClientResponseType<any, any>>((resolve) => {
    return fetch(builderConfig.baseUrl + endpoint + queryParams, {
      ...requestOptions,
      headers: { ...builderConfig.getHeaders(), ...headers },
      method,
      body: data instanceof FormData ? data : JSON.stringify(data),
    })
      .then(async (response) => {
        if (response.ok) {
          const responseData = await response.json();
          return resolve([responseData, null, response.status]);
        }
        return Promise.reject(response);
      })
      .catch((response) => {
        return resolve([null, response.error, response.status]);
      });
  });
};

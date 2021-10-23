import { ClientResponseType, ClientType, FetchClientOptions } from "./fetch.client.types";

export const fetchClient:ClientType<any, FetchClientOptions> = ({
  endpoint,
  headers,
  apiConfig,
  builderConfig,
}) => {
  const requestOptions = apiConfig.options || {};

  return new Promise<ClientResponseType<any, any>>((resolve) => {
    return fetch(
      builderConfig.baseUrl + endpoint,
      {
        ...requestOptions,
        headers,
      }
    )
      .then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          return resolve([data, null, response.status]);
        } else {
          return Promise.reject(response);
        }
      })
      .catch((response) => {
        return resolve([null, response.error, response.status]);
      });
  });
};
